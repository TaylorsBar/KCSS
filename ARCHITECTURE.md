# CartelWorx KCSS — Architecture Foundation

**Status:** Canonical source of truth  
**Product:** AI-Powered Automotive Intelligence Platform  
**Stack:** React 19 · TypeScript · Vite · Tailwind · Zustand · Firebase Hosting · Gemini

---

## 1. Single Source of Truth

| Layer | Location | Rule |
|-------|----------|------|
| Application code | `src/` | **Only** production code lives here |
| Entry | `index.html` → `src/main.tsx` → `src/App.tsx` | HashRouter |
| Styles | `src/index.css` + Tailwind | Design tokens via CSS variables |
| State | `src/store/useVehicleStore.ts` | Zustand |
| Appearance | `src/contexts/AppearanceContext.tsx` | Theme, material, LED, units |
| Services | `src/services/` | Gemini, storage, speech |
| E2E | `e2e/` | Playwright |
| CI/CD | `.github/workflows/cicd-grok.yml` | Build → E2E → Deploy |

**Legacy root folders** (`components/`, `pages/`, `hooks/`, `store/`, `services/`, root `App.tsx`, etc.) are **deprecated migration leftovers**. They must not be imported by `src/`.

---

## 2. Product Intent (PRD Alignment)

1. **Multi-theme dashboards** — Rally, Modern, Classic, Haltech, Minimalist, IC-7  
2. **Live vehicle data** — Zustand store + OBD boundary  
3. **AI CoPilot** — Voice in/out, Gemini-backed responses  
4. **Diagnostics** — Alerts, risk timeline, sensor charts  
5. **Tuning** — Maps, AI suggestions, safety analysis  
6. **Race Pack** — Session timing, history, leaderboard, camera  
7. **Appearance** — Theme, material, LED, units (persisted)  
8. **Security / Hedera** — Audit-style surfaces  
9. **AR / Accessories / Training** — Feature modules  

Every route in `src/App.tsx` resolves under `src/pages/`.

---

## 3. Unification Method

1. Inventory missing / external imports  
2. Promote into `src/` with clean relative imports  
3. Fix hacks (repurposed filenames → real components)  
4. Align README claims  
5. Green build + E2E  
6. Delete root legacy only after green  

---

## 4. Gap List

- [x] Architecture + README foundation  
- [x] `src/components/StartupOverlay.tsx`  
- [x] Core + secondary `src/components/icons/*`  
- [x] `GlassCard`, `TuningSlider`, `TuningMap`  
- [x] `storageService`, `useTrainingStore`  
- [x] Pages: `TuningPage`, `AIEngine`, `Accessories`, `RacePack`  
- [ ] Full `obdService` + `obdParser` under `src/` (Accessories uses store connect for now)  
- [ ] Root legacy tree deletion  
- [ ] Empty stubs cleanup (`.env*`, ThemeContext, etc.)  
- [ ] CI green confirmation after this pass  

---

*Grok · CartelWorx performance foundation · Neon locked*
