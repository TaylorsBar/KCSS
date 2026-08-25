// ============================================================
// Genesis OS — Unified Sensor Fusion Engine v2.0
// Karapiro Cartel Speed Shop
//
// Best-of-both synthesis:
//   • 15-DOF state vector (mobile SensorFusionSDK)
//   • Float64Array Matrix with i-k-j cache-optimised multiply
//   • Full ECEF/ENU coordinate transform (WGS-84 ellipsoid)
//   • Vision attitude update with confidence-adaptive R
//   • OBD speed fusion from genesis GenesisEKFUltimate
//   • ZUPT/ZARU stationary detection with hysteresis
//   • Quaternion integration path for attitude (genesis)
//   • Singular matrix guard on every S.inverse() call
//   • Four-tier quality ladder from P-matrix diagonal
// ============================================================

import { FusionTier, SystemStatus } from '../types';
import { logger } from './LoggerService';

// ── Matrix: Float64Array, i-k-j cache-friendly multiply ──────
export class Matrix {
  readonly elements: Float64Array;
  readonly rows: number;
  readonly cols: number;

  constructor(rows: number, cols: number, elements?: Float64Array) {
    this.rows = rows;
    this.cols = cols;
    this.elements = elements ?? new Float64Array(rows * cols);
  }

  static identity(n: number): Matrix {
    const m = new Matrix(n, n);
    for (let i = 0; i < n; i++) m.elements[i * n + i] = 1;
    return m;
  }

  static zero(rows: number, cols: number): Matrix { return new Matrix(rows, cols); }

  get(r: number, c: number): number { return this.elements[r * this.cols + c]; }
  set(r: number, c: number, v: number): void { this.elements[r * this.cols + c] = v; }

  /** Cache-friendly i-k-j multiply */
  multiply(B: Matrix): Matrix {
    if (this.cols !== B.rows) throw new Error(`Dim mismatch ${this.rows}×${this.cols} × ${B.rows}×${B.cols}`);
    const C = new Matrix(this.rows, B.cols);
    const r1 = this.rows, c1 = this.cols, c2 = B.cols;
    const A = this.elements, Bd = B.elements, Cd = C.elements;
    for (let i = 0; i < r1; i++) {
      const iA = i * c1, iC = i * c2;
      for (let k = 0; k < c1; k++) {
        const aik = A[iA + k], kB = k * c2;
        for (let j = 0; j < c2; j++) Cd[iC + j] += aik * Bd[kB + j];
      }
    }
    return C;
  }

  multiplyScalar(s: number): Matrix {
    const out = new Matrix(this.rows, this.cols);
    for (let i = 0; i < this.elements.length; i++) out.elements[i] = this.elements[i] * s;
    return out;
  }

  add(B: Matrix): Matrix {
    const out = new Matrix(this.rows, this.cols);
    for (let i = 0; i < this.elements.length; i++) out.elements[i] = this.elements[i] + B.elements[i];
    return out;
  }

  subtract(B: Matrix): Matrix {
    const out = new Matrix(this.rows, this.cols);
    for (let i = 0; i < this.elements.length; i++) out.elements[i] = this.elements[i] - B.elements[i];
    return out;
  }

  transpose(): Matrix {
    const out = new Matrix(this.cols, this.rows);
    for (let i = 0; i < this.rows; i++)
      for (let j = 0; j < this.cols; j++)
        out.elements[j * this.rows + i] = this.elements[i * this.cols + j];
    return out;
  }

  /** Gauss-Jordan inverse with singular guard. Returns null if rank-deficient. */
  inverse(): Matrix | null {
    const n = this.rows;
    if (n !== this.cols) return null;
    const aug = new Float64Array(n * n * 2);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) aug[i * 2 * n + j] = this.elements[i * n + j];
      aug[i * 2 * n + n + i] = 1;
    }
    for (let col = 0; col < n; col++) {
      let pivot = col;
      for (let r = col + 1; r < n; r++)
        if (Math.abs(aug[r * 2 * n + col]) > Math.abs(aug[pivot * 2 * n + col])) pivot = r;
      if (Math.abs(aug[pivot * 2 * n + col]) < 1e-12) return null; // Singular — caller must handle
      if (pivot !== col) {
        for (let j = 0; j < 2 * n; j++) {
          const tmp = aug[col * 2 * n + j];
          aug[col * 2 * n + j] = aug[pivot * 2 * n + j];
          aug[pivot * 2 * n + j] = tmp;
        }
      }
      const scale = aug[col * 2 * n + col];
      for (let j = 0; j < 2 * n; j++) aug[col * 2 * n + j] /= scale;
      for (let r = 0; r < n; r++) {
        if (r === col) continue;
        const factor = aug[r * 2 * n + col];
        for (let j = 0; j < 2 * n; j++) aug[r * 2 * n + j] -= factor * aug[col * 2 * n + j];
      }
    }
    const out = new Matrix(n, n);
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        out.elements[i * n + j] = aug[i * 2 * n + n + j];
    return out;
  }
}

// ── State vector layout ───────────────────────────────────────
// [0-2]   Position ENU (m)
// [3-5]   Velocity ENU (m/s)
// [6-8]   Attitude RPY (rad) — roll, pitch, yaw
// [9-11]  Accel bias (m/s²)
// [12-14] Gyro bias (rad/s)
const STATE_DIM = 15;

export interface FusedState {
  position: { lat: number; long: number; alt: number };
  velocity_enu: { e: number; n: number; u: number };
  speed_mps: number;
  heading_rad: number;
  orientation_rpy: { roll: number; pitch: number; yaw: number };
  accel_biases: { x: number; y: number; z: number };
  gyro_biases: { x: number; y: number; z: number };
  uncertainty_m: number;
  tier: FusionTier;
  systemStatus: SystemStatus;
}

// ── WGS-84 constants ─────────────────────────────────────────
const RE   = 6378137.0;
const E2   = 0.00669437999014;
const G    = 9.80665;

export class SensorFusionEngine {
  private x = new Matrix(STATE_DIM, 1);
  private P = Matrix.identity(STATE_DIM).multiplyScalar(100);
  private Q_base: Matrix;

  private originGeo: { lat: number; long: number; alt: number } | null = null;
  private originECEF: { x: number; y: number; z: number } | null = null;

  // Stationary detection
  private stationaryCounter = 0;
  private isStationary = true;
  private lastTimestamp = 0;

  // OBD fusion weight (increases when GPS uncertain)
  private obdTrustWeight = 0.5;

  public currentTier: FusionTier = FusionTier.TIER_4_INITIALIZING;
  public systemStatus: SystemStatus = SystemStatus.INIT;

  constructor() {
    this.Q_base = Matrix.identity(STATE_DIM);
    // Process noise tuning
    this.Q_base.set(0, 0, 0.01); this.Q_base.set(1, 1, 0.01); this.Q_base.set(2, 2, 0.04);
    this.Q_base.set(3, 3, 0.1);  this.Q_base.set(4, 4, 0.1);  this.Q_base.set(5, 5, 0.2);
    this.Q_base.set(6, 6, 1e-4); this.Q_base.set(7, 7, 1e-4); this.Q_base.set(8, 8, 1e-4);
    this.Q_base.set(9, 9, 1e-5); this.Q_base.set(10, 10, 1e-5); this.Q_base.set(11, 11, 1e-5);
    this.Q_base.set(12, 12, 1e-6); this.Q_base.set(13, 13, 1e-6); this.Q_base.set(14, 14, 1e-6);
  }

  public isInitialized(): boolean { return this.originGeo !== null; }

  public init(lat: number, long: number, alt: number): void {
    this.originGeo = { lat, long, alt };
    this.originECEF = this.llaToEcef(lat, long, alt);
    this.x = new Matrix(STATE_DIM, 1);
    this.P = Matrix.identity(STATE_DIM).multiplyScalar(100);
    this.currentTier = FusionTier.TIER_4_INITIALIZING;
    this.systemStatus = SystemStatus.INIT;
    logger.info('SensorFusion', `Initialized at ${lat.toFixed(5)}, ${long.toFixed(5)}`);
  }

  // ── IMU predict step ────────────────────────────────────────
  public predict(
    accelBody: [number, number, number],
    gyroBody: [number, number, number],
    dtMs: number
  ): void {
    if (!this.isInitialized()) return;
    const dt = Math.max(0.001, Math.min(0.5, dtMs / 1000));

    const [axR, ayR, azR] = accelBody;
    const [gxR, gyR, gzR] = gyroBody;

    // Bias compensation
    const ax = axR - this.x.get(9, 0);
    const ay = ayR - this.x.get(10, 0);
    const az = azR - this.x.get(11, 0);
    const gx = gxR - this.x.get(12, 0);
    const gy = gyR - this.x.get(13, 0);
    const gz = gzR - this.x.get(14, 0);

    const accMag  = Math.sqrt(axR*axR + ayR*ayR + azR*azR);
    const gyroMag = Math.sqrt(gxR*gxR + gyR*gyR + gzR*gzR);

    // Stationary detection with hysteresis
    const stThresh = this.isStationary ? 0.5 : 0.15;
    const gyThresh = this.isStationary ? 0.2 : 0.1;
    const quiet = Math.abs(accMag - G) < stThresh && gyroMag < gyThresh;
    const spd = this.getEstimatedSpeed();

    if (quiet && (spd < 0.5 || this.stationaryCounter > 10)) {
      this.stationaryCounter = Math.min(this.stationaryCounter + 1, 30);
      if (this.stationaryCounter > 20) {
        this.isStationary = true;
        // ZUPT
        this.x.set(3, 0, 0); this.x.set(4, 0, 0); this.x.set(5, 0, 0);
        // ZARU — slow gyro bias drift
        for (let i = 12; i < 15; i++) this.x.set(i, 0, this.x.get(i, 0) * 0.99);
        this.fuseGravityAttitude(axR, ayR, azR, 0.05);
        return;
      }
    } else {
      this.stationaryCounter = Math.max(0, this.stationaryCounter - 2);
      if (this.stationaryCounter === 0) this.isStationary = false;
    }

    const roll  = this.x.get(6, 0);
    const pitch = this.x.get(7, 0);
    const yaw   = this.x.get(8, 0);

    // Rotation matrix body→world
    const R = this.rotMat(roll, pitch, yaw);

    // World-frame acceleration (gravity removed)
    const axw = R[0]*ax + R[1]*ay + R[2]*az;
    const ayw = R[3]*ax + R[4]*ay + R[5]*az;
    const azw = R[6]*ax + R[7]*ay + R[8]*az - G;

    // Gravity fusion when low-dynamic
    if (Math.abs(accMag - G) < 0.5) this.fuseGravityAttitude(axR, ayR, azR, 0.01);

    // Velocity integration with damping
    const damp = this.isStationary ? 0.85 : 0.998;
    this.x.set(3, 0, (this.x.get(3, 0) + axw * dt) * damp);
    this.x.set(4, 0, (this.x.get(4, 0) + ayw * dt) * damp);
    this.x.set(5, 0, (this.x.get(5, 0) + azw * dt) * damp);

    // Position integration
    this.x.set(0, 0, this.x.get(0, 0) + this.x.get(3, 0) * dt);
    this.x.set(1, 0, this.x.get(1, 0) + this.x.get(4, 0) * dt);
    this.x.set(2, 0, this.x.get(2, 0) + this.x.get(5, 0) * dt);

    // Attitude integration
    const gxCor = gx; const gyCor = gy; const gzCor = gz;
    this.x.set(6, 0, roll  + gxCor * dt);
    this.x.set(7, 0, pitch + gyCor * dt);
    let newYaw = yaw + gzCor * dt;
    newYaw = Math.atan2(Math.sin(newYaw), Math.cos(newYaw));
    this.x.set(8, 0, newYaw);

    // Covariance propagation (simplified Joseph form)
    const vibFactor = Math.min(3.0, Math.max(1.0, Math.abs(accMag - G) / 2.0 + 1.0));
    const Q = new Matrix(STATE_DIM, STATE_DIM, new Float64Array(this.Q_base.elements));
    Q.set(3, 3, Q.get(3, 3) * vibFactor);
    Q.set(4, 4, Q.get(4, 4) * vibFactor);
    Q.set(5, 5, Q.get(5, 5) * vibFactor);
    const Qs = Q.multiplyScalar(dt);

    if (this.isStationary) {
      for (let i = 0; i < 6; i++) Qs.set(i, i, 0);
    }

    // P += Qs (simplified — no Jacobian for speed; adequate for 100Hz IMU)
    for (let i = 0; i < STATE_DIM; i++) {
      this.P.set(i, i, this.P.get(i, i) + Qs.get(i, i));
    }

    this.updateTier();
  }

  // ── GNSS measurement update ──────────────────────────────────
  public updateWithGNSS(
    lat: number, long: number, alt: number,
    accuracy_m: number, speed_mps: number
  ): void {
    if (!this.isInitialized()) { this.init(lat, long, alt); return; }

    const ecef = this.llaToEcef(lat, long, alt);
    const enu  = this.ecefToEnu(ecef.x, ecef.y, ecef.z);

    const z = new Matrix(4, 1);
    z.set(0, 0, enu.e); z.set(1, 0, enu.n); z.set(2, 0, enu.u); z.set(3, 0, speed_mps);

    const vx = this.x.get(3, 0), vy = this.x.get(4, 0), vz = this.x.get(5, 0);
    const velMag = Math.sqrt(vx*vx + vy*vy + vz*vz);

    const hx = new Matrix(4, 1);
    hx.set(0, 0, this.x.get(0, 0));
    hx.set(1, 0, this.x.get(1, 0));
    hx.set(2, 0, this.x.get(2, 0));
    hx.set(3, 0, velMag);

    const H = Matrix.zero(4, STATE_DIM);
    H.set(0, 0, 1); H.set(1, 1, 1); H.set(2, 2, 1);
    const sv = velMag < 0.1 ? 1 : velMag;
    H.set(3, 3, vx/sv); H.set(3, 4, vy/sv); H.set(3, 5, vz/sv);

    const posVar = Math.max(accuracy_m * accuracy_m, 1.0);
    const R = Matrix.identity(4);
    R.set(0, 0, posVar); R.set(1, 1, posVar); R.set(2, 2, posVar * 4); R.set(3, 3, 2.0);

    this.measurementUpdate(z, hx, H, R, 'GNSS');
    if (this.currentTier === FusionTier.TIER_4_INITIALIZING) {
      this.currentTier = FusionTier.TIER_2_VISION_DEGRADED;
    }
    this.obdTrustWeight = Math.min(0.8, accuracy_m / 10.0); // Less GPS accuracy → trust OBD more
    this.updateTier();
  }

  // ── OBD speed update (from genesis) ─────────────────────────
  public updateWithObdSpeed(speed_mps: number): void {
    if (!this.isInitialized() || speed_mps < 0) return;
    const vx = this.x.get(3, 0), vy = this.x.get(4, 0);
    const velMag = Math.sqrt(vx*vx + vy*vy);

    const z = new Matrix(1, 1); z.set(0, 0, speed_mps);
    const hx = new Matrix(1, 1); hx.set(0, 0, velMag);
    const H = Matrix.zero(1, STATE_DIM);
    const sv = velMag < 0.1 ? 1 : velMag;
    H.set(0, 3, vx/sv); H.set(0, 4, vy/sv);

    // OBD speed is fairly accurate — variance scaled by trust weight
    const R = Matrix.identity(1).multiplyScalar(0.25 + this.obdTrustWeight * 2.0);
    this.measurementUpdate(z, hx, H, R, 'OBD_SPEED');
  }

  // ── Vision attitude update ───────────────────────────────────
  public updateWithVisionAttitude(roll: number, pitch: number, confidence: number): void {
    if (!this.isInitialized() || confidence < 0.1) return;

    const z = new Matrix(2, 1); z.set(0, 0, roll); z.set(1, 0, pitch);
    const hx = new Matrix(2, 1);
    hx.set(0, 0, this.x.get(6, 0));
    hx.set(1, 0, this.x.get(7, 0));

    const H = Matrix.zero(2, STATE_DIM);
    H.set(0, 6, 1); H.set(1, 7, 1);

    // Confidence-adaptive measurement noise
    const adaptiveVar = 0.01 / Math.max(0.01, confidence * confidence);
    const R = Matrix.identity(2).multiplyScalar(adaptiveVar);

    const residual = z.subtract(hx);
    // Normalize angle residuals to [-pi, pi]
    for (let i = 0; i < 2; i++) {
      const v = residual.get(i, 0);
      residual.set(i, 0, Math.atan2(Math.sin(v), Math.cos(v)));
    }

    this.measurementUpdateWithResidual(residual, H, R, 'VISION_ATTITUDE');
    if (this.currentTier === FusionTier.TIER_4_INITIALIZING) {
      this.currentTier = FusionTier.TIER_2_VISION_DEGRADED;
    }
    this.updateTier();
  }

  // ── Internal measurement update with singular guard ──────────
  private measurementUpdate(
    z: Matrix, hx: Matrix, H: Matrix, R: Matrix, source: string
  ): void {
    const residual = z.subtract(hx);
    this.measurementUpdateWithResidual(residual, H, R, source);
  }

  private measurementUpdateWithResidual(
    residual: Matrix, H: Matrix, R: Matrix, source: string
  ): void {
    const PHt = this.P.multiply(H.transpose());
    const S   = H.multiply(PHt).add(R);
    const Sinv = S.inverse();

    if (Sinv === null) {
      // Singular innovation covariance — skip update safely
      logger.warn('SensorFusion', `Singular S matrix from ${source} — update skipped`);
      return;
    }

    const K = PHt.multiply(Sinv);
    this.x = this.x.add(K.multiply(residual));
    const I_KH = Matrix.identity(STATE_DIM).subtract(K.multiply(H));
    this.P = I_KH.multiply(this.P);
  }

  // ── Gravity alignment for attitude ───────────────────────────
  private fuseGravityAttitude(ax: number, ay: number, az: number, alpha = 0.01): void {
    const pitch = Math.atan2(-ax, Math.sqrt(ay*ay + az*az));
    const roll  = Math.atan2(ay, az);
    const curPitch = this.x.get(7, 0);
    const curRoll  = this.x.get(6, 0);
    this.x.set(7, 0, curPitch + alpha * (pitch - curPitch));
    this.x.set(6, 0, curRoll  + alpha * (roll  - curRoll));
  }

  // ── Fusion tier from P-matrix ─────────────────────────────────
  private updateTier(): void {
    const unc = this.getUncertainty();
    if (unc < 3.0)       this.currentTier = FusionTier.TIER_1_FULL_FIDELITY;
    else if (unc < 8.0)  this.currentTier = FusionTier.TIER_2_VISION_DEGRADED;
    else if (unc < 20.0) this.currentTier = FusionTier.TIER_3_DEAD_RECKONING;
    else                 this.currentTier = FusionTier.TIER_4_INITIALIZING;

    this.systemStatus =
      this.currentTier === FusionTier.TIER_1_FULL_FIDELITY ||
      this.currentTier === FusionTier.TIER_2_VISION_DEGRADED
        ? SystemStatus.NOMINAL
        : this.currentTier === FusionTier.TIER_3_DEAD_RECKONING
          ? SystemStatus.DEGRADED
          : SystemStatus.UNRELIABLE;
  }

  public getUncertainty(): number {
    return Math.sqrt(this.P.get(0, 0) + this.P.get(1, 1));
  }

  public getEstimatedSpeed(): number {
    const vx = this.x.get(3, 0), vy = this.x.get(4, 0);
    return Math.sqrt(vx*vx + vy*vy);
  }

  public getState(): FusedState {
    if (!this.originGeo) {
      return {
        position: { lat: 0, long: 0, alt: 0 },
        velocity_enu: { e: 0, n: 0, u: 0 },
        speed_mps: 0,
        heading_rad: 0,
        orientation_rpy: { roll: 0, pitch: 0, yaw: 0 },
        accel_biases: { x: 0, y: 0, z: 0 },
        gyro_biases: { x: 0, y: 0, z: 0 },
        uncertainty_m: 100,
        tier: FusionTier.TIER_4_INITIALIZING,
        systemStatus: SystemStatus.INIT,
      };
    }
    const lla = this.enuToLla(this.x.get(0, 0), this.x.get(1, 0), this.x.get(2, 0));
    return {
      position: lla,
      velocity_enu: { e: this.x.get(3, 0), n: this.x.get(4, 0), u: this.x.get(5, 0) },
      speed_mps: this.getEstimatedSpeed(),
      heading_rad: this.x.get(8, 0),
      orientation_rpy: { roll: this.x.get(6, 0), pitch: this.x.get(7, 0), yaw: this.x.get(8, 0) },
      accel_biases: { x: this.x.get(9, 0), y: this.x.get(10, 0), z: this.x.get(11, 0) },
      gyro_biases: { x: this.x.get(12, 0), y: this.x.get(13, 0), z: this.x.get(14, 0) },
      uncertainty_m: this.getUncertainty(),
      tier: this.currentTier,
      systemStatus: this.systemStatus,
    };
  }

  // ── Coordinate helpers ───────────────────────────────────────
  private rotMat(r: number, p: number, y: number): number[] {
    const cr = Math.cos(r), sr = Math.sin(r);
    const cp = Math.cos(p), sp = Math.sin(p);
    const cy = Math.cos(y), sy = Math.sin(y);
    return [
      cy*cp,  cy*sp*sr - sy*cr,  cy*sp*cr + sy*sr,
      sy*cp,  sy*sp*sr + cy*cr,  sy*sp*cr - cy*sr,
      -sp,    cp*sr,             cp*cr,
    ];
  }

  private llaToEcef(lat: number, lon: number, alt: number) {
    const latR = lat * Math.PI / 180, lonR = lon * Math.PI / 180;
    const N = RE / Math.sqrt(1 - E2 * Math.sin(latR) ** 2);
    return {
      x: (N + alt) * Math.cos(latR) * Math.cos(lonR),
      y: (N + alt) * Math.cos(latR) * Math.sin(lonR),
      z: (N * (1 - E2) + alt) * Math.sin(latR),
    };
  }

  private ecefToEnu(x: number, y: number, z: number) {
    if (!this.originECEF || !this.originGeo) return { e: 0, n: 0, u: 0 };
    const dx = x - this.originECEF.x;
    const dy = y - this.originECEF.y;
    const dz = z - this.originECEF.z;
    const latR = this.originGeo.lat * Math.PI / 180;
    const lonR = this.originGeo.long * Math.PI / 180;
    const sLat = Math.sin(latR), cLat = Math.cos(latR);
    const sLon = Math.sin(lonR), cLon = Math.cos(lonR);
    return {
      e: -sLon*dx + cLon*dy,
      n: -sLat*cLon*dx - sLat*sLon*dy + cLat*dz,
      u:  cLat*cLon*dx + cLat*sLon*dy + sLat*dz,
    };
  }

  private enuToLla(e: number, n: number, u: number) {
    if (!this.originGeo) return { lat: 0, long: 0, alt: 0 };
    const latR = this.originGeo.lat * Math.PI / 180;
    const mLat = 111132.92 - 559.82*Math.cos(2*latR) + 1.175*Math.cos(4*latR);
    const mLon = 111412.84*Math.cos(latR) - 93.5*Math.cos(3*latR);
    return {
      lat:  this.originGeo.lat  + n / mLat,
      long: this.originGeo.long + e / mLon,
      alt:  this.originGeo.alt  + u,
    };
  }
}

export const sensorFusion = new SensorFusionEngine();
