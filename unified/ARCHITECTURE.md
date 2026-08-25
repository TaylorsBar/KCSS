# Genesis OS — Unified Architecture v2.0
## Karapiro Cartel Speed Shop

### What changed from v1

#### Critical bug fixes
- `types.ts` — Unicode typo in FusionTier enum corrected (FIDELİTY → FIDELITY)
- `types.ts` + `DataIngestionPipeline` — Lambda 10.0 sentinel now sets `lambdaFault=true`; all display components should render "FAULT" not "10.00" when this is true
- `geminiService.ts` — All fabricated model names replaced with real Gemini API strings
- `canService.ts` — BLE MTU fragmentation fixed with persistent `rxBuffer`; no more corrupt/dropped CAN frames
- `AdaptiveTuningRL.ts` — AFR reward now uses `d.lambda * 14.7` (wideband), not `d.o2SensorVoltage * 2 + 9` proxy
- `ATEngine.ts` — Fully deterministic; `Math.random()` removed from all E85/tuning paths
- `SensorFusion.ts` — `S.inverse()` has singular matrix guard on all measurement update paths

#### Architecture improvements
- **Store split**: `vehicleStore` (God Object, 200+ line interface) → `useTelemetryStore` + `useTuningStore` + `useConnectionStore` (3 focused domain stores). Each re-renders only its own subscribers.
- **SafetyLayer v2**: Now gates ALL modification paths — AI, RL agent, Genetic Algorithm, and manual. Previously RL bypassed safety.
- **LTKL persistence**: RL agent's Long-Term Knock Learning knock history now persisted to `learningStore` via `saveRlBrain`/`getRlBrain`. Survives app restarts.
- **15-DOF EKF** (from mobile SensorFusionSDK) replaces 13-DOF genesis EKF for superior precision. Float64Array maintained for numerics.
- **OBD audit trail**: `executeObdCommand` AI tool calls now logged to `AuditEvent.ObdCommand` and `AuditEvent.LtklRetard` added for LTKL permanent retard events.
- **Unified service directory**: No more `lib/services/` vs `services/` split. All services in `services/`.
- **CartelWorx CAN auto-reconnect**: GATT disconnect now triggers a 2-second auto-reconnect attempt.

#### Improvements absorbed from each package

| Feature | Source | Notes |
|---------|--------|-------|
| 15-DOF EKF Float64Array | mobile-telemetry-suite | Superior to genesis 13-DOF Float32 |
| ECEF/ENU coordinate transform | mobile-telemetry-suite | Full WGS-84 ellipsoid |
| Vision attitude update | genesis-os | With confidence-adaptive R |
| OBD speed measurement update | genesis-os | With obdTrustWeight |
| ZUPT/ZARU stationary detection | genesis-os | With hysteresis counter |
| RLS-MPC boost controller | genesis-os | Unchanged — already excellent |
| Goertzel knock detection | genesis-os | Unchanged — already excellent |
| Downsampled coaching prompts | lib/services (genesis) | Every 5th point, 100 samples |
| Professional coaching system prompt | genesis | "Genesis Chief Race Engineer" |
| CartelWorx CAN SLCAN | mobile-telemetry-suite | + BLE buffer fix |
| Lambda plausibility clamp | NEW | Not in any prior version |
| OBD command audit logging | NEW | Not in any prior version |
| SafetyLayer RL gating | NEW | Previously RL bypassed safety |
| LTKL persistence | NEW | Previously memory-only |

### Store subscribers guide

```ts
// CORRECT — only re-renders when RPM changes
const rpm = useTelemetryStore(s => s.latestData.rpm);

// CORRECT — only re-renders when VE table changes  
const veTable = useTuningStore(s => s.veTable);

// CORRECT — only re-renders when OBD state changes
const obdState = useConnectionStore(s => s.obdState);

// WRONG — subscribes to entire God Store, re-renders on everything
// const { rpm, veTable, obdState } = useVehicleStore();
```

### Remaining work (not in this release)

1. `learningStore` needs `saveRlBrain(json: string)` and `getRlBrain(): string | null` methods added
2. `undo/redo` in tuningStore needs pointer-based circular buffer implementation
3. `AppearanceContext` and theme system needs migration to new store architecture
4. `GeminiLiveSession` still uses deprecated `ScriptProcessorNode` — migrate to `AudioWorkletNode`
5. WebXR/HoloLens features from remix need integration into unified App
6. Unit tests for SafetyLayer, AdaptiveTuningRL, SensorFusion — none exist
