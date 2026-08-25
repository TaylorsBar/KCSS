# Genesis Rebuild / KCSS

This branch carries the KCSS presentation shell forward with the selected Genesis OS v2 engine architecture: explicit fusion, adaptive tuning, safety gating, ingestion, and CAN service boundaries. The interface remains deliberately signal-first: live channels are separated from recommendations, and write-capable workflows remain capability-gated.

## Review cues

- **Engine layer:** `unified/lib/SensorFusion.ts`, `unified/services/AdaptiveTuningRL.ts`, `unified/services/SafetyLayer.ts`
- **Data boundary:** `unified/services/DataIngestionPipeline.ts`, `unified/services/canService.ts`
- **Product shell:** `src/` and `components/`
- **Design intent:** carbon surfaces, Kinetic Lime verified-state accents, restrained motion, and operator-readable density.
