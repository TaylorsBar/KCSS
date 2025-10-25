import { ConnectionStatus, SensorDataPoint } from '../types';
import { parseOBDResponse, parseDTCResponse } from '../utils/obdParser';

// --- Web Bluetooth Type Definitions (for no-build environments) ---
// By defining these here, we get better type safety and autocompletion
// without needing external `@types/web-bluetooth` which requires a build step.
interface BluetoothDevice extends EventTarget {
  readonly id: string;
  readonly name?: string;
  readonly gatt?: BluetoothRemoteGATTServer;
  watchAdvertisements(options?: unknown): Promise<void>;
}
interface BluetoothRemoteGATTServer {
  readonly device: BluetoothDevice;
  readonly connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
}
interface BluetoothRemoteGATTService {
  readonly device: BluetoothDevice;
  readonly uuid: string;
  getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
  getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
}
interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  readonly service: BluetoothRemoteGATTService;
  readonly uuid: string;
  readonly value?: DataView;
  properties: {
      readonly broadcast: boolean;
      readonly read: boolean;
      readonly writeWithoutResponse: boolean;
      readonly write: boolean;
      readonly notify: boolean;
      readonly indicate: boolean;
      readonly authenticatedSignedWrites: boolean;
  };
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  writeValue(value: BufferSource): Promise<void>;
}

// --- Constants ---
const ELM327_SERVICE_UUID = '00001101-0000-1000-8000-00805f9b34fb';
enum CommState { IDLE, POLLING, COMMAND_MODE }

// --- Callbacks ---
type StatusCallback = (status: ConnectionStatus) => void;
type DataCallback = (data: Partial<SensorDataPoint>) => void;

class OBDService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private txCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private rxCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  
  private pollingInterval: number | null = null;
  private statusCallback: StatusCallback = () => {};
  private dataCallback: DataCallback = () => {};
  
  private responseBuffer = '';
  private commState: CommState = CommState.IDLE;
  
  // For COMMAND_MODE
  private commandResolver: ((value: string[]) => void) | null = null;
  private commandRejecter: ((reason?: any) => void) | null = null;
  private commandTimeout: number | null = null;

  private pidsToPoll = [
    '0C', '0D', '05', '0F', '0B', '04', '42', '0A', '2F',
  ];

  subscribe(statusCallback: StatusCallback, dataCallback: DataCallback) {
    this.statusCallback = statusCallback;
    this.dataCallback = dataCallback;
  }

  private updateStatus(status: ConnectionStatus) {
    this.statusCallback(status);
  }
  
  private onDataReceived(data: Partial<SensorDataPoint>) {
    this.dataCallback(data);
  }

  async connect() {
    // FIX: Cast navigator to 'any' to access the Web Bluetooth API without TypeScript errors.
    if (!(navigator as any).bluetooth) {
      this.updateStatus(ConnectionStatus.ERROR);
      alert("Web Bluetooth API is not available in this browser. Please use Chrome or Edge.");
      return;
    }

    try {
      this.updateStatus(ConnectionStatus.CONNECTING);
      // FIX: Cast navigator to 'any' to access the Web Bluetooth API without TypeScript errors.
      this.device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: [ELM327_SERVICE_UUID] }],
        optionalServices: [ELM327_SERVICE_UUID]
      });

      if (!this.device.gatt) throw new Error("GATT server not available.");
      
      this.server = await this.device.gatt.connect();
      const service = await this.server.getPrimaryService(ELM327_SERVICE_UUID);
      
      const characteristics = await service.getCharacteristics();
      this.rxCharacteristic = characteristics.find(c => c.properties.notify);
      this.txCharacteristic = characteristics.find(c => c.properties.write || c.properties.writeWithoutResponse);

      if (!this.rxCharacteristic || !this.txCharacteristic) {
        throw new Error("Could not find required TX/RX characteristics.");
      }
      
      this.device.addEventListener('gattserverdisconnected', () => this.disconnect());

      await this.rxCharacteristic.startNotifications();
      this.rxCharacteristic.addEventListener('characteristicvaluechanged', this.handleNotifications.bind(this));

      await this.initializeELM327();
      this.startPolling();
      this.updateStatus(ConnectionStatus.CONNECTED);

    } catch (error) {
      console.error("Bluetooth connection failed:", error);
      this.updateStatus(ConnectionStatus.ERROR);
      this.disconnect();
    }
  }

  disconnect() {
    this.stopPolling();
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.server = null;
    this.txCharacteristic = null;
    this.rxCharacteristic = null;
    this.commState = CommState.IDLE;
    this.updateStatus(ConnectionStatus.DISCONNECTED);
  }

  /**
   * Fetches Diagnostic Trouble Codes (DTCs) from the vehicle.
   * This method temporarily stops PID polling to send a specific command and wait for a complete response.
   */
  async fetchDTCs(): Promise<string[]> {
      if (!this.txCharacteristic || !this.rxCharacteristic) {
          throw new Error("Not connected to vehicle.");
      }
      // Pause polling and enter command mode
      this.stopPolling();
      this.commState = CommState.COMMAND_MODE;

      try {
        const responses = await this.executeCommand('03', 5000);
        return responses.flatMap(parseDTCResponse);
      } finally {
        // Always resume polling, even if the command fails
        this.startPolling();
      }
  }
  
  private async executeCommand(command: string, timeout: number): Promise<string[]> {
    return new Promise(async (resolve, reject) => {
        this.commandResolver = resolve;
        this.commandRejecter = reject;

        this.commandTimeout = window.setTimeout(() => {
            if (this.commandRejecter) {
                this.commandRejecter(new Error(`Command '${command}' timed out after ${timeout}ms.`));
                this.resetCommandState();
            }
        }, timeout);

        this.responseBuffer = ''; // Clear buffer for the new command
        await this.writeCommand(command);
    });
  }
  
  private resetCommandState() {
      if (this.commandTimeout) clearTimeout(this.commandTimeout);
      this.commandTimeout = null;
      this.commandResolver = null;
      this.commandRejecter = null;
      this.responseBuffer = '';
  }

  private async writeCommand(cmd: string) {
    if (!this.txCharacteristic) return;
    const encoder = new TextEncoder();
    await this.txCharacteristic.writeValue(encoder.encode(cmd + '\r'));
  }

  private handleNotifications(event: Event) {
    const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
    if (!value) return;
    
    const decoder = new TextDecoder();
    const str = decoder.decode(value);
    this.responseBuffer += str;

    // ELM327 commands are terminated with a '>' character.
    if (this.responseBuffer.includes('>')) {
      const responses = this.responseBuffer.split('\r').filter(line => line.length > 0 && line !== '>');
      
      if (this.commState === CommState.POLLING) {
        for (const response of responses) {
            const parsedData = parseOBDResponse(response);
            if (parsedData) this.onDataReceived(parsedData);
        }
      } else if (this.commState === CommState.COMMAND_MODE && this.commandResolver) {
          this.commandResolver(responses);
          this.resetCommandState();
      }
      this.responseBuffer = '';
    }
  }

  private async initializeELM327() {
    const initCommands = ['ATZ', 'ATE0', 'ATL0', 'ATSP0']; // Reset, Echo Off, Linefeeds Off, Auto Protocol
    for (const cmd of initCommands) {
        await this.writeCommand(cmd);
        await new Promise(resolve => setTimeout(resolve, 150)); // Delay for ELM327 to process
    }
  }

  private startPolling() {
    this.commState = CommState.POLLING;
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    let pidIndex = 0;
    this.pollingInterval = window.setInterval(() => {
        if (this.txCharacteristic && this.commState === CommState.POLLING) {
            const pid = this.pidsToPoll[pidIndex];
            this.writeCommand(`01${pid}`);
            pidIndex = (pidIndex + 1) % this.pidsToPoll.length;
        }
    }, 100);
  }

  private stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.commState = CommState.IDLE;
  }
}

export const obdService = new OBDService();