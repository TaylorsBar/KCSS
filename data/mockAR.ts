
import { ComponentHotspot } from '../types/index';

export const inspectorComponents = [
    { id: 'turbo', name: 'Turbocharger' },
    { id: 'o2-sensor', name: 'O2 Sensor' },
    { id: 'map-sensor', name: 'MAP Sensor' },
    { id: 'alternator', name: 'Alternator' },
    { id: 'intake', name: 'Air Intake' },
    { id: 'coolant', name: 'Coolant System' },
    { id: 'oil-filter', name: 'Oil System' },
    { id: 'injectors', name: 'Fuel Injectors' },
    { id: 'intercooler', name: 'Intercooler' },
    { id: 'wastegate', name: 'Wastegate' },
    { id: 'ecu', name: 'ECU' },
];

export const MOCK_HOTSPOTS: ComponentHotspot[] = [
    { id: 'o2-sensor', name: 'O2 Sensor', cx: '75%', cy: '70%', status: 'Failing' },
    { id: 'map-sensor', name: 'MAP Sensor', cx: '40%', cy: '40%', status: 'Warning' },
    { id: 'alternator', name: 'Alternator', cx: '30%', cy: '65%', status: 'Normal' },
    { id: 'turbo', name: 'Turbocharger', cx: '70%', cy: '50%', status: 'Normal' },
    { id: 'intake', name: 'Air Intake / Throttle Body', cx: '25%', cy: '40%', status: 'Normal' },
    { id: 'coolant', name: 'Coolant Outlet', cx: '45%', cy: '35%', status: 'Normal' },
    { id: 'oil-filter', name: 'Oil Filter', cx: '35%', cy: '75%', status: 'Normal' },
];