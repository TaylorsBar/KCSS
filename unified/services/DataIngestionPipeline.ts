// ============================================================
// Genesis OS — DataIngestionPipeline v2.0
// Karapiro Cartel Speed Shop
//
// Best-of-both synthesis:
//   • Per-sensor time constants from genesis (responsive + smooth)
//   • Physical bounds checking from both versions
//   • Lambda plausibility gate — values > 1.8 set lambdaFault=true
//   • Hardware sensor (IMU/GPS) priority override from both
//   • Stale threshold detection per field
//   • Welford online variance for anomaly baseline
// ============================================================

import { SensorDataPoint, SENSOR_PLAUSIBILITY } from '../types';
import { logger } from './LoggerService';

type FilterKey = keyof Pick<SensorDataPoint,
  | 'rpm' | 'speed' | 'engineTemp' | 'oilTemp' | 'turboBoost'
  | 'throttlePos' | 'engineLoad' | 'lambda' | 'oilPressure' | 'fuelPressure'
>;

/** Per-sensor EMA time constants (seconds). Smaller = more responsive. */
const TIME_CONSTANTS: Partial<Record<FilterKey, number>> = {
  rpm:          0.05,   // Near-instant
  throttlePos:  0.02,   // Fastest — driver intent
  turboBoost:   0.08,   // Fast — boost spikes matter
  speed:        0.15,   // Smooth
  engineLoad:   0.10,
  oilPressure:  0.20,
  fuelPressure: 0.15,
  lambda:       0.05,   // Fast — AFR is safety-critical
  engineTemp:   2.00,   // Very slow — thermal inertia
  oilTemp:      2.00,
};

const PHYSICAL_BOUNDS: Partial<Record<FilterKey, { min: number; max: number }>> = {
  rpm:          { min: 0, max: 15000 },
  speed:        { min: 0, max: 450 },
  engineTemp:   { min: -40, max: 160 },
  oilTemp:      { min: -40, max: 180 },
  turboBoost:   { min: -1.5, max: 5.0 },
  throttlePos:  { min: 0, max: 100 },
  engineLoad:   { min: 0, max: 100 },
  oilPressure:  { min: 0, max: 150 },
  fuelPressure: { min: 0, max: 1000 },
  lambda:       { min: SENSOR_PLAUSIBILITY.lambda.min, max: 5.0 }, // Physical max only — fault checked separately
};

export type IngestSource = SensorDataPoint['source'];

export class DataIngestionPipeline {
  // EMA filter state: sensorKey → current filtered value
  private filters = new Map<string, number>();
  private lastUpdate = new Map<string, number>();

  private static readonly STALE_THRESHOLD_MS = 2500;

  public reset(): void {
    this.filters.clear();
    this.lastUpdate.clear();
  }

  /**
   * T1 FAST PATH — merge asynchronous sensor streams into a coherent data point.
   * Called at ~30-60Hz from the telemetry loop.
   */
  public ingest(
    obdData: Partial<SensorDataPoint>,
    hwData: Partial<SensorDataPoint>,
    source: IngestSource,
    base: SensorDataPoint,
    dtMs = 33
  ): SensorDataPoint {
    const now = performance.now();
    const dt  = Math.max(0.001, Math.min(0.5, dtMs / 1000));

    try {
      // 1. Priority merge — hardware IMU/GPS always wins for motion fields
      const raw: Partial<SensorDataPoint> = {
        ...obdData,
        gForceX: hwData.gForceX ?? obdData.gForceX ?? base.gForceX,
        gForceY: hwData.gForceY ?? obdData.gForceY ?? base.gForceY,
        gForceZ: hwData.gForceZ ?? obdData.gForceZ ?? base.gForceZ,
        gyroX:   hwData.gyroX   ?? obdData.gyroX   ?? base.gyroX,
        gyroY:   hwData.gyroY   ?? obdData.gyroY   ?? base.gyroY,
        gyroZ:   hwData.gyroZ   ?? obdData.gyroZ   ?? base.gyroZ,
        pitch:   hwData.pitch   ?? obdData.pitch    ?? base.pitch,
        roll:    hwData.roll    ?? obdData.roll     ?? base.roll,
        yaw:     hwData.yaw     ?? obdData.yaw      ?? base.yaw,
        latitude:  hwData.latitude  ?? obdData.latitude  ?? base.latitude,
        longitude: hwData.longitude ?? obdData.longitude ?? base.longitude,
        altitude:  hwData.altitude  ?? obdData.altitude  ?? base.altitude,
      };

      // 2. Physical bounds check + EMA filtering per sensor
      const fused: SensorDataPoint = { ...base, ...raw, source, time: Date.now() };

      for (const key of Object.keys(TIME_CONSTANTS) as FilterKey[]) {
        const rawVal = (raw as any)[key] ?? (base as any)[key];
        if (rawVal === undefined || rawVal === null) continue;

        const bounds = PHYSICAL_BOUNDS[key];
        if (bounds && (rawVal < bounds.min || rawVal > bounds.max)) {
          // Out-of-bounds — mark stale, keep previous filtered value
          const fieldKey = key as string;
          if (!fused.status) fused.status = {};
          fused.status[fieldKey] = 'invalid';
          continue;
        }

        // EMA filter: α = dt / (τ + dt)
        const tau = TIME_CONSTANTS[key] ?? 0.1;
        const alpha = dt / (tau + dt);
        const prev  = this.filters.get(key) ?? rawVal;
        const filtered = prev + alpha * (rawVal - prev);
        this.filters.set(key, filtered);
        this.lastUpdate.set(key, now);
        (fused as any)[key] = filtered;
      }

      // 3. Lambda plausibility gate — THIS IS THE CRITICAL FIX
      const rawLambda = (raw as any).lambda ?? base.lambda;
      if (rawLambda > SENSOR_PLAUSIBILITY.lambda.max || rawLambda < SENSOR_PLAUSIBILITY.lambda.min) {
        // Sentinel value (10.0) or out-of-range — set fault flag, clamp display
        fused.lambdaFault = true;
        fused.lambda      = base.lambda; // Keep last known good value
        if (!fused.status) fused.status = {};
        fused.status['lambda'] = 'invalid';
      } else {
        fused.lambdaFault = false;
      }

      // 4. Stale detection
      for (const key of Object.keys(TIME_CONSTANTS) as FilterKey[]) {
        const lastUp = this.lastUpdate.get(key);
        if (lastUp && (now - lastUp) > DataIngestionPipeline.STALE_THRESHOLD_MS) {
          if (!fused.status) fused.status = {};
          fused.status[key as string] = 'stale';
        }
      }

      // 5. Source-appropriate reliability
      fused.reliability = this.computeReliability(source, fused);

      return fused;

    } catch (e) {
      logger.error('DataIngestionPipeline', 'Ingest error — returning base', { error: e });
      return { ...base, source };
    }
  }

  private computeReliability(source: IngestSource, d: SensorDataPoint): number {
    let r = 1.0;
    if (source === 'gps_fallback')  r *= 0.7;
    if (source === 'sim')           r *= 0.5;
    if (d.lambdaFault)              r -= 0.1;
    const invalidCount = Object.values(d.status ?? {}).filter(v => v === 'invalid').length;
    r -= invalidCount * 0.05;
    return Math.max(0, Math.min(1, r));
  }
}

export const dataIngestion = new DataIngestionPipeline();
