import { ConnectionStatus, SensorDataPoint } from '../types';
import { parseOBDResponse } from '../utils/obdParser';

const ELM327_SERVICE_UUID = '00001101-0000-1000-8000-00805f9b34fb';

type StatusCallback = (status: ConnectionStatus) => void;
type DataCallback = (data: Partial<SensorDataPoint>) => void;

class OBDService {
  // FIX: Replaced BluetoothDevice with `any` to avoid type errors when Web Bluetooth typings are not present.
  private device: any | null = null;
  // FIX: Replaced BluetoothRemoteGATTServer with `any` to avoid type errors when Web Bluetooth typings are not present.
  private server: any | null = null;
  // FIX: Replaced BluetoothRemoteGATTCharacteristic with `any` to avoid type errors when Web Bluetooth typings are not present.
  private txCharacteristic: any | null = null;
  // FIX: Replaced BluetoothRemoteGATTCharacteristic with `any` to avoid type errors when Web Bluetooth typings are not present.
  private rxCharacteristic: any | null = null;
  private pollingInterval: number | null = null;
  private statusCallback: StatusCallback = () => {};
  private dataCallback: DataCallback = () => {};
  private responseBuffer = '';

  private pidsToPoll = [
    '0C', // Engine RPM
    '0D', // Vehicle Speed
    '05', // Engine Coolant Temperature
    '0F', // Intake Air Temperature
    '0B', // Intake Manifold Absolute Pressure (for Boost)
    '04', // Calculated Engine Load
    '42', // Battery Voltage (Control Module)
    '5C', // Engine Oil Temperature
    '0A', // Fuel Pressure
    '2F', // Fuel Tank Level Input
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
    // FIX: Used type assertion `(navigator as any)` because `bluetooth` is not a standard property on the Navigator type.
    if (!(navigator as any).bluetooth) {
      this.updateStatus(ConnectionStatus.ERROR);
      alert("Web Bluetooth API is not available in this browser. Please use Chrome or Edge.");
      return;
    }

    try {
      this.updateStatus(ConnectionStatus.CONNECTING);
      // FIX: Used type assertion `(navigator as any)` because `bluetooth` is not a standard property on the Navigator type.
      this.device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: [ELM327_SERVICE_UUID] }],
        optionalServices: [ELM327_SERVICE_UUID]
      });

      if (!this.device.gatt) {
          throw new Error("GATT server not available.");
      }
      this.server = await this.device.gatt.connect();
      const service = await this.server.getPrimaryService(ELM327_SERVICE_UUID);
      
      const characteristics = await service.getCharacteristics();
      // Heuristic to find TX/RX characteristics
      this.rxCharacteristic = characteristics.find((c: any) => c.properties.notify);
      this.txCharacteristic = characteristics.find((c: any) => c.properties.write || c.properties.writeWithoutResponse);

      if (!this.rxCharacteristic || !this.txCharacteristic) {
          throw new Error("Could not find TX/RX characteristics.");
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
    if (this.device && this.device.gatt && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.server = null;
    this.txCharacteristic = null;
    this.rxCharacteristic = null;
    this.updateStatus(ConnectionStatus.DISCONNECTED);
  }
  
  private async writeCommand(cmd: string) {
    if (!this.txCharacteristic) return;
    const encoder = new TextEncoder();
    await this.txCharacteristic.writeValue(encoder.encode(cmd + '\r'));
  }

  private handleNotifications(event: Event) {
    // FIX: Using `any` for event target as type definitions are not available.
    const value = (event.target as any).value;
    if (!value) return;
    
    const decoder = new TextDecoder();
    const str = decoder.decode(value).trim();
    this.responseBuffer += str;

    if (str.endsWith('>')) {
      const responses = this.responseBuffer.split('\r').filter(line => line.length > 0 && line !== '>');
      for (const response of responses) {
          const parsedData = parseOBDResponse(response);
          if (parsedData) {
              this.onDataReceived(parsedData);
          }
      }
      this.responseBuffer = '';
    }
  }

  private async initializeELM327() {
    const initCommands = ['ATZ', 'ATE0', 'ATL0', 'ATSP0']; // Reset, Echo Off, Linefeeds Off, Auto Protocol
    for (const cmd of initCommands) {
        await this.writeCommand(cmd);
        await new Promise(resolve => setTimeout(resolve, 100)); // Short delay between commands
    }
  }

  private startPolling() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    let pidIndex = 0;
    this.pollingInterval = window.setInterval(() => {
        if (this.txCharacteristic) {
            const pid = this.pidsToPoll[pidIndex];
            this.writeCommand(`01${pid}`);
            pidIndex = (pidIndex + 1) % this.pidsToPoll.length;
        }
    }, 100); // Poll 10 times per second
  }

  private stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
}

export const obdService = new OBDService();