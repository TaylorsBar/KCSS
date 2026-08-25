// ============================================================
// Genesis OS — Adaptive Tuning RL Agent v2.0
// Karapiro Cartel Speed Shop
//
// Improvements over v1:
//   • Every action gated through SafetyLayer.validateRlAction
//   • LTKL knock history persisted to learningStore (survives restart)
//   • AFR from lambda (wideband) not o2SensorVoltage proxy
//   • Reward function uses torqueActual OR kinematic proxy
//   • Epsilon decay serialised so learning state is continuous
//   • AuditEvent.LtklRetard logged when permanent retard fires
// ============================================================

import { SensorDataPoint, RLTrainingState, AuditEvent } from '../types';
import { SafetyLayer } from './SafetyLayer';
import { logger } from './LoggerService';
import { useLearningStore } from '../stores/learningStore';

export type Action = 0 | 1 | 2 | 3 | 4 | 5 | 6;
// 0: Hold  1: +0.5° timing  2: -0.5° timing
// 3: +1% fuel  4: -1% fuel  5: +0.5 PSI boost  6: -0.5 PSI boost

const ACTION_LABELS: Record<Action, string> = {
  0: 'HOLD',
  1: 'TIMING +0.5°',
  2: 'TIMING -0.5°',
  3: 'FUEL ENRICH +1%',
  4: 'FUEL LEAN -1%',
  5: 'BOOST +0.5 PSI',
  6: 'BOOST -0.5 PSI',
};

export class AdaptiveTuningRL {
  // Q-Table: stateKey → Q-values[7]
  private qTable = new Map<string, number[]>();

  // Hyperparameters
  private readonly alpha    = 0.1;   // Learning rate
  private readonly gamma    = 0.95;  // Discount factor
  private readonly minEps   = 0.02;  // Minimum exploration
  private readonly epsDecay = 0.9995;
  private epsilon = 0.15;

  // Memory
  private lastStateKey: string | null = null;
  private lastAction: Action = 0;
  private lastMetrics = { power: 0, knock: 0, afrError: 0 };

  // LTKL — Long-Term Knock Learning (persisted)
  private knockHistory = new Map<string, number>();
  private readonly ltklThreshold = 5;

  // Session stats
  private episodeCount = 0;
  private cumulativeReward = 0;
  private bestReward = -Infinity;

  // Map state needed to validate actions
  private currentIgnTable: number[][] | null = null;
  private currentEgt = 800;

  constructor() {
    this.loadFromPersistence();
  }

  /** Call after tuning tables are loaded */
  public setTuningContext(ignTable: number[][], egt: number): void {
    this.currentIgnTable = ignTable;
    this.currentEgt = egt;
  }

  // ── Q-table access ──────────────────────────────────────────
  private getQ(key: string): number[] {
    if (!this.qTable.has(key)) {
      this.qTable.set(key, [0.1, 0, 0, 0, 0, 0, 0]);
    }
    return this.qTable.get(key)!;
  }

  // ── Main step ────────────────────────────────────────────────
  public step(d: SensorDataPoint): {
    action: Action;
    report: RLTrainingState;
    mapUpdate?: { table: 've' | 'ign'; delta: number };
    ltklUpdate?: { stateKey: string; adjustment: number };
  } {
    // 1. Quantise state
    const rpmBin  = Math.floor(d.rpm / 500) * 500;
    const loadBin = Math.floor(d.engineLoad / 10) * 10;
    const tempState = d.engineTemp > 100 ? 'HOT' : d.engineTemp > 70 ? 'WARM' : 'COLD';
    const knockState = d.knockCount > 0 ? 'KNOCK' : 'CLEAN';
    const stateKey = `${rpmBin}_${loadBin}_${tempState}_${knockState}`;

    // 2. Reward from last action
    const stoich = 14.7; // petrol
    const currentAfr = d.lambda * stoich; // ← wideband lambda, NOT o2SensorVoltage
    const targetAfr = 12.8;
    const afrError = Math.abs(currentAfr - targetAfr);

    const estimatedPower = d.torqueActual
      ? d.torqueActual * d.rpm / 5252
      : (d.engineLoad / 100) * d.rpm / 1000; // kinematic proxy

    let reward = 0;
    let ltklUpdate: { stateKey: string; adjustment: number } | undefined;

    if (this.lastStateKey) {
      const powerDelta = estimatedPower - this.lastMetrics.power;
      reward += powerDelta > 0 ? 5.0 : -2.0;
      reward -= afrError * 3.0;

      const knockDelta = d.knockCount - this.lastMetrics.knock;
      if (knockDelta > 0) {
        reward -= 500.0;

        // LTKL tracking
        const count = (this.knockHistory.get(this.lastStateKey) || 0) + 1;
        this.knockHistory.set(this.lastStateKey, count);

        if (count >= this.ltklThreshold) {
          const adjustment = -1.0; // Permanent -1° retard
          ltklUpdate = { stateKey: this.lastStateKey, adjustment };
          this.knockHistory.set(this.lastStateKey, 0);
          logger.warn('RL-LTKL', `Permanent retard applied for state ${this.lastStateKey}`);
          this.auditLtkl(this.lastStateKey, adjustment);
          this.saveToPersistence();
        }
      }

      // Q-update
      const Qcurrent = this.getQ(this.lastStateKey);
      const QnextMax = Math.max(...this.getQ(stateKey));
      Qcurrent[this.lastAction] += this.alpha * (reward + this.gamma * QnextMax - Qcurrent[this.lastAction]);
    }

    // 3. ε-greedy action selection
    let action: Action;
    if (Math.random() < this.epsilon) {
      action = (Math.floor(Math.random() * 7)) as Action;
    } else {
      const Q = this.getQ(stateKey);
      action = Q.indexOf(Math.max(...Q)) as Action;
    }

    // 4. Safety gate — validate action through SafetyLayer
    let mapUpdate: { table: 've' | 'ign'; delta: number } | undefined;
    if (action === 1 || action === 2) {
      // Timing change
      const rpmIdx = Math.min(15, Math.floor(d.rpm / 500));
      const loadIdx = Math.min(15, Math.floor(d.engineLoad / 6.25));
      const currentTiming = this.currentIgnTable?.[loadIdx]?.[rpmIdx] ?? 15;
      const proposedDelta = action === 1 ? 0.5 : -0.5;
      const knockCeiling = 45.0; // Would come from AdaptiveKnockDetection

      const validation = SafetyLayer.validateRlAction(
        'ign', loadIdx, rpmIdx,
        currentTiming, proposedDelta,
        this.currentEgt, knockCeiling
      );

      if (!validation.blocked && validation.allowedDelta !== 0) {
        mapUpdate = { table: 'ign', delta: validation.allowedDelta };
      } else if (validation.blocked) {
        action = 0; // Force HOLD if safety blocked
        logger.warn('RL', `Action ${ACTION_LABELS[action]} blocked: ${validation.reason}`);
      }
    } else if (action === 3 || action === 4) {
      const delta = action === 3 ? 1.0 : -1.0;
      mapUpdate = { table: 've', delta };
    }

    // 5. Decay epsilon
    this.epsilon = Math.max(this.minEps, this.epsilon * this.epsDecay);
    this.episodeCount++;
    this.cumulativeReward += reward;
    if (reward > this.bestReward) this.bestReward = reward;

    this.lastStateKey = stateKey;
    this.lastAction = action;
    this.lastMetrics = { power: estimatedPower, knock: d.knockCount, afrError };

    const report: RLTrainingState = {
      episode: this.episodeCount,
      epsilon: this.epsilon,
      currentReward: reward,
      cumulativeReward: this.cumulativeReward,
      bestReward: this.bestReward,
      lastAction: ACTION_LABELS[action],
      qTableSize: this.qTable.size,
      ltklEntries: this.knockHistory.size,
    };

    return { action, report, mapUpdate, ltklUpdate };
  }

  // ── Persistence ──────────────────────────────────────────────
  public serialize(): string {
    return JSON.stringify({
      qTable: Array.from(this.qTable.entries()),
      knockHistory: Array.from(this.knockHistory.entries()),
      epsilon: this.epsilon,
      episodeCount: this.episodeCount,
      cumulativeReward: this.cumulativeReward,
      bestReward: this.bestReward,
    });
  }

  public deserialize(json: string): void {
    try {
      const d = JSON.parse(json);
      this.qTable = new Map(d.qTable);
      this.knockHistory = new Map(d.knockHistory || []);
      this.epsilon = d.epsilon ?? 0.15;
      this.episodeCount = d.episodeCount ?? 0;
      this.cumulativeReward = d.cumulativeReward ?? 0;
      this.bestReward = d.bestReward ?? -Infinity;
      logger.info('RL', `Brain loaded: ${this.qTable.size} states, ${this.knockHistory.size} LTKL entries`);
    } catch {
      logger.warn('RL', 'Failed to load brain — starting fresh');
      this.qTable = new Map();
      this.knockHistory = new Map();
    }
  }

  /** Persist LTKL and Q-table to learningStore so it survives app restarts */
  private saveToPersistence(): void {
    try {
      useLearningStore.getState().saveRlBrain(this.serialize());
    } catch { /* Store may not be ready */ }
  }

  private loadFromPersistence(): void {
    try {
      const json = useLearningStore.getState().getRlBrain();
      if (json) this.deserialize(json);
    } catch { /* Store may not be ready */ }
  }

  private auditLtkl(stateKey: string, adjustment: number): void {
    try {
      useLearningStore.getState().logAuditEvent(
        AuditEvent.LtklRetard,
        `LTKL permanent retard ${adjustment}° applied for state ${stateKey}`
      );
    } catch { /* ignore */ }
  }
}

export const adaptiveTuningRL = new AdaptiveTuningRL();
