
import { MaintenanceRecord } from '../types/index';

export const MOCK_LOGS: MaintenanceRecord[] = [
  { id: '1', date: '2024-07-15', service: 'Oil & Filter Change', notes: 'Performed by KC SpeedShop. Used Mobil 1 5W-30.', verified: true, isAiRecommendation: false },
  { id: '2', date: '2024-06-28', service: 'Replace Air Filter', notes: 'Airflow sensor detected reduced intake. Recommended replacement.', verified: true, isAiRecommendation: true },
  { id: '3', date: '2024-06-01', service: 'Tire Rotation', notes: 'Standard 5,000-mile service.', verified: true, isAiRecommendation: false },
  { id: '4', date: '2024-05-20', service: 'Inspect O2 Sensor', notes: 'System predicted potential O2 sensor degradation based on response times.', verified: false, isAiRecommendation: true },
  { id: '5', date: '2024-03-10', service: 'Brake Fluid Flush', notes: 'Completed at dealer.', verified: false, isAiRecommendation: false },
];