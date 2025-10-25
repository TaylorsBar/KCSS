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
  const cleaned = response.replace(/\s/g, '').trim();
  
  if (cleaned.includes('NODATA')) {
    return null;
  }
  
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

export const parseDTCResponse = (response: string): string[] => {
    const cleaned = response.replace(/\s/g, '').trim();
    // Mode 03 (DTC) response starts with 43.
    if (!cleaned.startsWith('43')) {
        return [];
    }
    
    // The hex data for codes starts after the '43' and the byte indicating the number of codes.
    // We can ignore the count byte and just parse all subsequent byte pairs.
    const hexData = cleaned.substring(4).match(/.{1,2}/g) || [];
    
    // Defensive check: Ensure we have pairs of bytes to process.
    if (hexData.length % 2 !== 0) {
        console.warn("Malformed DTC response, odd number of hex bytes:", cleaned);
        // We can attempt to process the even part of the array.
        hexData.pop();
    }
    
    const dtcs: string[] = [];
    for (let i = 0; i < hexData.length; i += 2) {
        const byte1 = hexData[i];
        const byte2 = hexData[i+1];
        if (byte1 === '00' && byte2 === '00') {
            continue; // Ignore padding bytes
        }
        
        const firstCharVal = parseInt(byte1.charAt(0), 16);
        let firstChar = '';
        
        // The first two bits of the first byte determine the code's letter.
        // 00xx -> P (Powertrain)
        // 01xx -> C (Chassis)
        // 10xx -> B (Body)
        // 11xx -> U (Network)
        switch (firstCharVal >> 2) {
            case 0: firstChar = 'P'; break;
            case 1: firstChar = 'C'; break;
            case 2: firstChar = 'B'; break;
            case 3: firstChar = 'U'; break;
        }
        
        const secondChar = (firstCharVal & 0x03).toString(16);
        const restOfCode = byte1.charAt(1) + byte2;
        dtcs.push(`${firstChar}${secondChar}${restOfCode}`.toUpperCase());
    }
    
    return dtcs;
};
