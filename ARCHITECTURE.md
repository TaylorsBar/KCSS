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

---

## 2. Legacy purge status (2026-08-26)

### Removed
- Root stubs: `App.tsx`, `index.tsx`, `CoPilot.tsx`, `Sidebar.tsx`, `types.ts`
- Empty files: `.env.development`, `.env.production`, `.firebaserc`, `ThemeContext`, `ModernThemeDashboard`
- Root `store/`, `contexts/`, `utils/`
- Root `services/` (gemini, obd, speech, storage, ai.worker)
- Root `hooks/` (full set; `useSpeechRecognition` promoted to `src/` first)
- Root pages: Accessories, RacePack, TuningPage (+ more in progress)

### Still pending (next purge pass)
- Remaining `pages/*` duplicates
- Entire root `components/*` tree (icons, gauges, tachometers, etc.)

**Do not import from root `components/` or `pages/`.** Canonical lives under `src/`.

---

## 3. Product Intent

1. Multi-theme dashboards  
2. Live vehicle data  
3. AI CoPilot  
4. Diagnostics  
5. Tuning  
6. Race Pack  
7. Appearance (persisted)  
8. Security / Hedera  
9. AR / Accessories / Training  

---

*Grok · CartelWorx · Ground Control → MajorTom · Neon locked*
