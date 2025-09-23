
import { DiagnosticAlert, AlertLevel } from '../types/index';

export const MOCK_ALERTS: DiagnosticAlert[] = [
  { id: '1', level: AlertLevel.Warning, component: 'O2 Sensor (Bank 1)', message: 'Sensor response time is 15% below optimal. Potential fuel efficiency loss.', timestamp: '2 minutes ago', isFaultRelated: true },
  { id: '2', level: AlertLevel.Info, component: 'Tire Pressure (RR)', message: 'Pressure is 2 PSI low. Recommend inflating soon.', timestamp: '1 hour ago' },
  { id: '3', level: AlertLevel.Critical, component: 'MAP Sensor', message: 'Erratic readings detected under load. Risk of engine stalling. Immediate inspection required.', timestamp: '5 seconds ago', isFaultRelated: true },
];