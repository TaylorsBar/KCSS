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
| Services | `src/services/` | Gemini, OBD, speech, storage |
| E2E | `e2e/` | Playwright |
| CI/CD | `.github/workflows/cicd-grok.yml` | Build → E2E → Deploy |

**Legacy root folders** (`components/`, `pages/`, `hooks/`, `store/`, `services/`, root `App.tsx`, etc.) are **deprecated migration leftovers**. They must not be imported by `src/`. They will be removed once parity is complete.

---

## 2. Product Intent (PRD Alignment)

The platform claims and ships:

1. **Multi-theme dashboards** — Rally, Modern, Classic, Haltech, Minimalist, IC-7  
2. **Live vehicle data** — Zustand store + OBD service (mock/real)  
3. **AI CoPilot** — Voice in/out, Gemini-backed responses, alert announcements  
4. **Diagnostics** — Alerts, risk timeline, sensor charts  
5. **Tuning** — Maps, AI suggestions, safety analysis  
6. **Race Pack** — Session tools, track camera, comparisons  
7. **Appearance** — Theme, accent material, ambient LED, units (persisted)  
8. **Security / Hedera** — Audit-style surfaces  
9. **AR Assistant / Accessories / Training** — Feature modules  

Every route in `src/App.tsx` must resolve to a real page under `src/pages/` with working imports under `src/`.

---

## 3. Design System

- Tokens: `--theme-accent-primary`, `--glass-bg`, `--glass-border`, neumorphic shadows  
- Themes via `data-theme` on `<html>`  
- Materials via `data-material`  
- Fonts: Inter, Orbitron (`font-display`), Bebas Neue (`font-classic`), Roboto Mono  
- Components use glass panels, glow borders, connection-status frame colors  

---

## 4. Unification Method (how we work the codebase)

1. **Inventory** — list every import from `src/` that points outside `src/` or is missing  
2. **Promote** — copy/adapt missing modules from root → `src/` with `.ts/.tsx` extensions and relative paths  
3. **Fix** — broken icons, stubs, empty files, dual implementations  
4. **Align claims** — README + this doc match runtime routes and capabilities  
5. **Delete legacy** — remove root duplicates only after CI build + E2E are green  
6. **Harden** — types strict, E2E coverage, visual baselines  

---

## 5. Current Gap List (tracked)

- [x] Document foundation (this file)  
- [ ] `src/components/StartupOverlay.tsx`  
- [ ] `src/components/icons/*` (full set)  
- [ ] Missing pages in `src/pages/`: AIEngine, Accessories, RacePack, TuningPage  
- [ ] Missing tuning widgets: TuningSlider, TuningMap  
- [ ] Root legacy tree cleanup  
- [ ] Empty stubs (`.env*`, `.firebaserc`, ThemeContext, ModernThemeDashboard)  
- [ ] README product claims vs real routes  

---

## 6. Non-Goals (for this foundation pass)

- Rewriting dashboard gauge math  
- Real OBD hardware integration (keep service boundary)  
- Expanding beyond existing product surface  

---

*Grok · CartelWorx performance foundation · Neon locked*
