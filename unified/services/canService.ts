// ============================================================
// Genesis OS — CartelWorx CAN Service v2.0
// Karapiro Cartel Speed Shop
//
// Improvements over v1:
//   • Persistent rxBuffer handles BLE MTU packet fragmentation
//   • Auto-reconnect on GATT disconnect
//   • Frame rate tracking for diagnostics
//   • Typed frame subscription with unsubscribe return
//   • Connection state callbacks for UI binding
// ============================================================

import { logger } from './LoggerService';

const CAN_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e'; // Nordic UART
const CAN_RX_CHAR_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // Write to device
const CAN_TX_CHAR_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; // Notify from device

export interface CanFrame {
  timestamp: number;
  id: number;
  extended: boolean;
  dlc: number;
  data: number[];
  direction: 'rx' | 'tx';
}

export type CanBitrate  = 125000 | 250000 | 500000 | 1000000;
export type CanMode     = 'NORMAL' | 'LOOPBACK' | 'LISTEN_ONLY' | 'CONFIG';
export type CanCallback = (frame: CanFrame) => void;

export interface CanStatus {
  connected: boolean;
  deviceName: string | null;
  bitrate: CanBitrate;
  mode: CanMode;
  framesReceived: number;
  frameRateFps: number;
}

class CanService {
  private device: any | null = null;
  private server: any | null = null;
  private rxChar: any | null = null;
  private txChar: any | null = null;

  private isConnected = false;
  private subscribers = new Map<symbol, CanCallback>();
  private onStateChange: ((status: CanStatus) => void)[] = [];

  private bitrate: CanBitrate = 500000;
  private mode: CanMode = 'NORMAL';

  // ── BLE fragmentation fix ────────────────────────────────────
  /** Persistent receive buffer — handles packets split across MTU boundaries */
  private rxBuffer = '';

  // Diagnostics
  private framesReceived = 0;
  private fpsCounter = 0;
  private frameRateFps = 0;
  private fpsInterval: ReturnType<typeof setInterval> | null = null;

  public async connect(): Promise<boolean> {
    if (!navigator.bluetooth) {
      logger.warn('CanService', 'Web Bluetooth not available');
      return false;
    }

    try {
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [CAN_SERVICE_UUID] }],
        optionalServices: [CAN_SERVICE_UUID],
      });

      this.device.addEventListener('gattserverdisconnected', () => this.handleDisconnect());
      this.server  = await this.device.gatt!.connect();

      const svc    = await this.server.getPrimaryService(CAN_SERVICE_UUID);
      this.rxChar  = await svc.getCharacteristic(CAN_RX_CHAR_UUID);
      this.txChar  = await svc.getCharacteristic(CAN_TX_CHAR_UUID);

      await this.txChar.startNotifications();
      this.txChar.addEventListener('characteristicvaluechanged', (e: Event) => this.handleNotification(e));

      this.isConnected = true;
      this.rxBuffer = '';
      this.startFpsCounter();

      await this.configureMCP2515(this.bitrate, this.mode);

      logger.info('CanService', `Connected to ${this.device.name ?? 'CartelWorx'} @ ${this.bitrate} baud`);
      this.emitState();
      return true;

    } catch (err) {
      logger.error('CanService', 'Connection failed', { err });
      this.cleanup();
      return false;
    }
  }

  public disconnect(): void {
    if (this.device?.gatt?.connected) this.device.gatt.disconnect();
    this.cleanup();
  }

  public subscribe(cb: CanCallback): () => void {
    const key = Symbol();
    this.subscribers.set(key, cb);
    return () => this.subscribers.delete(key);
  }

  public onStatusChange(cb: (s: CanStatus) => void): () => void {
    this.onStateChange.push(cb);
    return () => { this.onStateChange = this.onStateChange.filter(c => c !== cb); };
  }

  public getStatus(): CanStatus {
    return {
      connected: this.isConnected,
      deviceName: this.device?.name ?? null,
      bitrate: this.bitrate,
      mode: this.mode,
      framesReceived: this.framesReceived,
      frameRateFps: this.frameRateFps,
    };
  }

  public async sendFrame(id: number, data: number[], useExtended = false): Promise<void> {
    if (!this.isConnected || !this.rxChar) return;

    const type  = useExtended ? 'T' : 't';
    const idStr = useExtended
      ? id.toString(16).toUpperCase().padStart(8, '0')
      : id.toString(16).toUpperCase().padStart(3, '0');
    const dlcStr   = data.length.toString();
    const dataStr  = data.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('');
    const cmd      = `${type}${idStr}${dlcStr}${dataStr}`;

    await this.writeRaw(cmd);

    this.notify({
      timestamp: Date.now(), id, extended: useExtended,
      dlc: data.length, data, direction: 'tx',
    });
  }

  // ── BLE notification handler with persistent buffer ──────────
  private handleNotification(event: Event): void {
    const value = (event.target as any).value as DataView;
    if (!value) return;

    const text = new TextDecoder().decode(value);

    // Append to buffer — handles split packets across MTU boundaries
    this.rxBuffer += text;

    // Split on \r (SLCAN delimiter) — keep any incomplete line in the buffer
    const lines = this.rxBuffer.split('\r');
    this.rxBuffer = lines.pop() ?? ''; // Last element may be incomplete

    for (const line of lines) {
      if (line.length > 0) this.parseSlcanLine(line);
    }
  }

  /**
   * SLCAN parser: tiiildd... / Tiiiiiiiiildd...
   * t = standard (3-char id), T = extended (8-char id)
   */
  private parseSlcanLine(line: string): void {
    const type = line.charAt(0);
    if (type !== 't' && type !== 'T') return;

    const extended = type === 'T';
    const idLen    = extended ? 8 : 3;

    if (line.length < 1 + idLen + 1) return;

    const id  = parseInt(line.substr(1, idLen), 16);
    const dlc = parseInt(line.charAt(1 + idLen), 10);

    if (isNaN(id) || isNaN(dlc) || dlc > 8) return;

    const dataStr = line.substr(1 + idLen + 1);
    const data: number[] = [];
    for (let i = 0; i < dataStr.length; i += 2) {
      const byte = parseInt(dataStr.substr(i, 2), 16);
      if (!isNaN(byte)) data.push(byte);
    }

    const frame: CanFrame = { timestamp: Date.now(), id, extended, dlc, data, direction: 'rx' };
    this.framesReceived++;
    this.fpsCounter++;
    this.notify(frame);
  }

  private notify(frame: CanFrame): void {
    for (const cb of this.subscribers.values()) {
      try { cb(frame); } catch (e) { logger.warn('CanService', 'Subscriber threw', { e }); }
    }
  }

  private async writeRaw(data: string): Promise<void> {
    if (!this.rxChar) return;
    const bytes = new TextEncoder().encode(data + '\r');
    try {
      await this.rxChar.writeValue(bytes);
    } catch (e) {
      logger.error('CanService', 'Write failed', { e });
    }
  }

  /** Configure MCP2515 on device */
  private async configureMCP2515(bitrate: CanBitrate, mode: CanMode): Promise<void> {
    const bitrateCmd: Record<CanBitrate, string> = {
      125000:  'S2', // 125k
      250000:  'S5', // 250k
      500000:  'S6', // 500k
      1000000: 'S8', // 1M
    };
    await this.writeRaw(bitrateCmd[bitrate] ?? 'S6');
    await this.writeRaw('O'); // Open channel
    this.bitrate = bitrate;
    this.mode    = mode;
    logger.info('CanService', `MCP2515 configured: ${bitrate} baud, mode ${mode}`);
  }

  private handleDisconnect(): void {
    this.isConnected = false;
    this.rxBuffer = '';
    logger.warn('CanService', 'GATT disconnected');
    this.emitState();

    // Auto-reconnect after 2 seconds
    setTimeout(async () => {
      if (!this.isConnected && this.device?.gatt) {
        try {
          this.server = await this.device.gatt.connect();
          const svc  = await this.server.getPrimaryService(CAN_SERVICE_UUID);
          this.txChar = await svc.getCharacteristic(CAN_TX_CHAR_UUID);
          await this.txChar.startNotifications();
          this.txChar.addEventListener('characteristicvaluechanged', (e: Event) => this.handleNotification(e));
          this.rxChar = await svc.getCharacteristic(CAN_RX_CHAR_UUID);
          this.isConnected = true;
          logger.info('CanService', 'Auto-reconnected');
          this.emitState();
        } catch {
          logger.warn('CanService', 'Auto-reconnect failed');
        }
      }
    }, 2000);
  }

  private cleanup(): void {
    this.isConnected = false;
    this.rxBuffer    = '';
    this.device  = null;
    this.server  = null;
    this.rxChar  = null;
    this.txChar  = null;
    this.stopFpsCounter();
    this.emitState();
  }

  private startFpsCounter(): void {
    this.fpsInterval = setInterval(() => {
      this.frameRateFps = this.fpsCounter;
      this.fpsCounter   = 0;
    }, 1000);
  }

  private stopFpsCounter(): void {
    if (this.fpsInterval) { clearInterval(this.fpsInterval); this.fpsInterval = null; }
  }

  private emitState(): void {
    const s = this.getStatus();
    for (const cb of this.onStateChange) { try { cb(s); } catch {} }
  }
}

export const canService = new CanService();
