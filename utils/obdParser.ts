import { SensorDataPoint } from '../types';

type PidParser = (hex: string[]) => Partial<SensorDataPoint> | null;

const pidMap: { [pid: string]: PidParser } = {
  '0C': (hex) => { // Engine RPM
    const [A, B] = hex.map(h => parseInt(h, 16));
    return { rpm: ((A * 256) + B) / 4 };
  },
  '0D': (hex) => { // Vehicle Speed
    const [A] = hex.map(h => parseInt(h, 16));
    return { speed: A };
  },
  '05': (hex) => { // Engine Coolant Temperature
    const [A] = hex.map(h => parseInt(h, 16));
    return { engineTemp: A - 40 };
  },
  '0F': (hex) => { // Intake Air Temperature
    const [A] = hex.map(h => parseInt(h, 16));
    return { inletAirTemp: A - 40 };
  },
  '0B': (hex) => { // Intake Manifold Absolute Pressure
    const [A] = hex.map(h => parseInt(h, 16));
    const kpa = A;
    const bar = kpa / 100;
    const boost = bar - 1.0; // Assuming 1 bar atmospheric pressure
    return { turboBoost: boost };
  },
  '04': (hex) => { // Calculated Engine Load
    const [A] = hex.map(h => parseInt(h, 16));
    return { engineLoad: (A * 100) / 255 };
  },
  '42': (hex) => { // Control Module Voltage
    const [A, B] = hex.map(h => parseInt(h, 16));
    return { batteryVoltage: ((A * 256) + B) / 1000 };
  },
  '5C': (hex) => { // Engine Oil Temperature
    const [A] = hex.map(h => parseInt(h, 16));
    // Assuming this sensor is available. In a real car, it might not be.
    // Let's use it to populate fuelTemp as a proxy if it's there.
    return { fuelTemp: A - 40 };
  },
  '0A': (hex) => { // Fuel Pressure
    const [A] = hex.map(h => parseInt(h, 16));
    const kpa = A * 3;
    return { fuelPressure: kpa / 100 }; // Convert to bar
  },
  '2F': (hex) => { // Fuel Tank Level
      const [A] = hex.map(h => parseInt(h, 16));
      const fuelLevel = (A * 100) / 255;
      return { fuelUsed: 100 - fuelLevel }; // Invert for fuelUsed
  },
  // TODO: Add parsers for fuel trims if needed
};

export const parseOBDResponse = (response: string): Partial<SensorDataPoint> | null => {
  const cleaned = response.replace(/\s/g, '');
  
  // A standard successful response starts with '41' (Mode 01 success)
  if (!cleaned.startsWith('41')) {
    return null;
  }

  const pid = cleaned.substring(2, 4).toUpperCase();
  const hexData = cleaned.substring(4).match(/.{1,2}/g) || [];

  const parser = pidMap[pid];
  if (parser) {
    try {
        return parser(hexData);
    } catch (e) {
        console.warn(`Error parsing PID ${pid} with data ${hexData}:`, e);
        return null;
    }
  }
  
  return null;
};
