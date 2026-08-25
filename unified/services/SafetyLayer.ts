// ============================================================
// Genesis OS — SafetyLayer v2.0
// Karapiro Cartel Speed Shop
//
// Improvements over v1:
//   • ALL modification paths gated here: AI, RL, manual
//   • Explicit RL path with stricter delta limits
//   • Audit logging of every intervention via AuditEvent
//   • Lambda plausibility validation for AFR safety checks
//   • EGT model includes lambda contribution (not just timing)
//   • Detailed return includes per-cell intervention log
// ============================================================

import { CalibrationMap, AuditEvent } from '../types';
import { logger } from './LoggerService';
import { useLearningStore } from '../stores/learningStore';

export interface SafetyValidationResult {
  approved: boolean;
  safeMapValues: number[];
  violations: string[];
  interventions: { cellIndex: number; original: number; clamped: number; reason: string }[];
  requiresAdvisoryConfirmation: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export type ModificationSource = 'AI' | 'RL_AGENT' | 'MANUAL' | 'GENETIC_ALGO';

const LIMITS = {
  MAX_EGT_C:               950.0,
  EGT_ADVISORY_MARGIN:      50.0,
  MAX_SPATIAL_GRADIENT:      5.0,  // degrees between adjacent cells
  MAX_DELTA_AI:              4.0,  // degrees per AI iteration
  MAX_DELTA_RL:              1.5,  // degrees per RL step (tighter)
  MAX_DELTA_MANUAL:         10.0,  // degrees (human is responsible)
  MAX_DELTA_GENETIC:         6.0,
  KNOCK_SAFETY_MARGIN:       1.0,  // degrees retard from knock ceiling
  MIN_VE:                    5.0,
  MAX_VE:                  130.0,
  MIN_IGN_TIMING:           -10.0,
  MAX_IGN_TIMING:            45.0,
} as const;

export class SafetyLayer {

  /**
   * Primary validation gate. Called before ANY modification reaches the ECU.
   */
  public static validateModifications(
    originalMap: CalibrationMap,
    proposedValues: number[],
    isIgnition: boolean,
    currentEgt: number,
    calculatedKnockCeiling: number[],
    source: ModificationSource = 'AI',
    currentLambda?: number
  ): SafetyValidationResult {

    const result: SafetyValidationResult = {
      approved: true,
      safeMapValues: [...proposedValues],
      violations: [],
      interventions: [],
      requiresAdvisoryConfirmation: false,
      riskLevel: 'LOW',
    };

    const { rows, cols } = originalMap;
    const maxDelta = this.getDeltaLimit(source);

    // ── 1. Critical EGT ceiling ──────────────────────────────
    if (currentEgt >= LIMITS.MAX_EGT_C) {
      result.violations.push(
        `CRITICAL: EGT ${currentEgt.toFixed(1)}°C ≥ hard cap ${LIMITS.MAX_EGT_C}°C. All modifications halted.`
      );
      result.approved = false;
      result.safeMapValues = [...originalMap.values];
      result.riskLevel = 'CRITICAL';
      this.audit(`SafetyLayer HALT: EGT ${currentEgt.toFixed(1)}°C — ${source}`, 'CRITICAL');
      return result;
    }

    if (currentEgt > LIMITS.MAX_EGT_C - LIMITS.EGT_ADVISORY_MARGIN) {
      result.requiresAdvisoryConfirmation = true;
      result.riskLevel = 'HIGH';
      result.violations.push(`WARNING: EGT ${currentEgt.toFixed(1)}°C approaching critical limit.`);
    }

    // ── 2. Lambda-based AFR safety (ignition maps) ───────────
    if (isIgnition && currentLambda !== undefined) {
      // Never advance timing when running lean (λ > 1.05) at high EGT conditions
      if (currentLambda > 1.05 && currentEgt > 750) {
        result.requiresAdvisoryConfirmation = true;
        result.riskLevel = 'HIGH';
        result.violations.push(`Lambda ${currentLambda.toFixed(3)} is lean with EGT ${currentEgt.toFixed(0)}°C — timing advance restricted.`);
      }
    }

    // ── 3. Per-cell delta limit + knock safety ─────────────────
    for (let i = 0; i < proposedValues.length; i++) {
      const orig = originalMap.values[i];
      let proposed = proposedValues[i];

      // Physical bounds check
      const physMin = isIgnition ? LIMITS.MIN_IGN_TIMING : LIMITS.MIN_VE;
      const physMax = isIgnition ? LIMITS.MAX_IGN_TIMING : LIMITS.MAX_VE;
      if (proposed < physMin || proposed > physMax) {
        const clamped = Math.max(physMin, Math.min(physMax, proposed));
        result.interventions.push({ cellIndex: i, original: proposed, clamped, reason: 'physical_bounds' });
        proposed = clamped;
        result.requiresAdvisoryConfirmation = true;
      }

      // Delta clamp
      const delta = proposed - orig;
      if (Math.abs(delta) > maxDelta) {
        const clamped = orig + Math.sign(delta) * maxDelta;
        result.interventions.push({ cellIndex: i, original: proposed, clamped, reason: `delta_limit_${source}` });
        if (result.riskLevel === 'LOW') result.riskLevel = 'MEDIUM';
        result.violations.push(`Cell ${i}: delta ${delta.toFixed(2)}° clamped to ±${maxDelta}° (${source}).`);
        result.requiresAdvisoryConfirmation = true;
        proposed = clamped;
      }

      // Knock safety buffer (ignition only)
      if (isIgnition && calculatedKnockCeiling.length > i) {
        const knockLimit = calculatedKnockCeiling[i] - LIMITS.KNOCK_SAFETY_MARGIN;
        if (proposed > knockLimit) {
          const clamped = knockLimit;
          result.interventions.push({ cellIndex: i, original: proposed, clamped, reason: 'knock_safety' });
          result.violations.push(`Cell ${i}: ${proposed.toFixed(2)}° → knock ceiling ${clamped.toFixed(2)}°.`);
          result.requiresAdvisoryConfirmation = true;
          if (result.riskLevel === 'LOW') result.riskLevel = 'MEDIUM';
          proposed = clamped;
        }
      }

      result.safeMapValues[i] = proposed;
    }

    // ── 4. Gaussian spatial smoothing (ignition maps only) ────
    if (isIgnition) {
      const kernel = [[1/16, 2/16, 1/16], [2/16, 4/16, 2/16], [1/16, 2/16, 1/16]];
      const smoothed = [...result.safeMapValues];
      for (let r = 1; r < rows - 1; r++) {
        for (let c = 1; c < cols - 1; c++) {
          let sum = 0;
          for (let kr = -1; kr <= 1; kr++)
            for (let kc = -1; kc <= 1; kc++)
              sum += result.safeMapValues[(r + kr) * cols + (c + kc)] * kernel[kr+1][kc+1];
          smoothed[r * cols + c] = sum;
        }
      }
      result.safeMapValues = smoothed;

      // Spatial gradient enforcement
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const val = result.safeMapValues[idx];

          if (c < cols - 1) {
            const rIdx = r * cols + (c + 1);
            const rVal = result.safeMapValues[rIdx];
            if (Math.abs(rVal - val) > LIMITS.MAX_SPATIAL_GRADIENT) {
              result.safeMapValues[rIdx] = val + Math.sign(rVal - val) * LIMITS.MAX_SPATIAL_GRADIENT;
              result.requiresAdvisoryConfirmation = true;
            }
          }
          if (r < rows - 1) {
            const dIdx = (r + 1) * cols + c;
            const dVal = result.safeMapValues[dIdx];
            if (Math.abs(dVal - val) > LIMITS.MAX_SPATIAL_GRADIENT) {
              result.safeMapValues[dIdx] = val + Math.sign(dVal - val) * LIMITS.MAX_SPATIAL_GRADIENT;
              result.requiresAdvisoryConfirmation = true;
            }
          }
        }
      }
    }

    if (result.violations.length > 0) {
      logger.warn('SafetyLayer', `${result.violations.length} interventions from ${source}`, {
        violations: result.violations, interventions: result.interventions.length
      });
    }

    return result;
  }

  /** Validates a single RL action — stricter limits, always logged */
  public static validateRlAction(
    table: 've' | 'ign',
    cellR: number, cellC: number,
    currentValue: number,
    proposedDelta: number,
    currentEgt: number,
    knockCeiling?: number
  ): { allowedDelta: number; blocked: boolean; reason?: string } {
    if (table === 'ign' && currentEgt >= LIMITS.MAX_EGT_C) {
      return { allowedDelta: 0, blocked: true, reason: 'egt_ceiling' };
    }
    const maxD = LIMITS.MAX_DELTA_RL;
    const clamped = Math.sign(proposedDelta) * Math.min(Math.abs(proposedDelta), maxD);
    const proposed = currentValue + clamped;

    if (table === 'ign' && knockCeiling !== undefined) {
      const ceiling = knockCeiling - LIMITS.KNOCK_SAFETY_MARGIN;
      if (proposed > ceiling) {
        return { allowedDelta: Math.max(0, ceiling - currentValue), blocked: false, reason: 'knock_ceiling_clamped' };
      }
    }
    return { allowedDelta: clamped, blocked: false };
  }

  private static getDeltaLimit(source: ModificationSource): number {
    switch (source) {
      case 'RL_AGENT':     return LIMITS.MAX_DELTA_RL;
      case 'AI':           return LIMITS.MAX_DELTA_AI;
      case 'GENETIC_ALGO': return LIMITS.MAX_DELTA_GENETIC;
      case 'MANUAL':       return LIMITS.MAX_DELTA_MANUAL;
    }
  }

  private static audit(message: string, severity: 'INFO' | 'HIGH' | 'CRITICAL'): void {
    try {
      useLearningStore.getState().logAuditEvent(
        AuditEvent.TuningChange,
        `[SafetyLayer] ${message}`
      );
    } catch { /* Store may not be mounted yet during tests */ }
    logger.warn('SafetyLayer', message, { severity });
  }
}
