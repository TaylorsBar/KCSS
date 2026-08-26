# CartelWorx KCSS

**Superior Technical Pillar** — AI-Powered Automotive Intelligence Platform.

Live: [taylorsbar.github.io/KCSS](https://taylorsbar.github.io/KCSS/)

---

## What it is

A multi-theme performance dashboard for drivers and tuners:

- **Dashboards** — Rally, Modern, Classic, Haltech, Minimalist, IC-7  
- **AI CoPilot** — voice-first assistant (Gemini) with alert announcements  
- **Diagnostics** — live-style sensors, alerts, risk timeline  
- **Tuning** — maps, AI suggestions, safety checks  
- **Race Pack** — session tools and track-oriented views  
- **Appearance** — themes, accent materials, ambient LED, metric/imperial (persisted)  
- **Security & Hedera** — audit / DLT-oriented surfaces  

---

## Stack

| Piece | Choice |
|-------|--------|
| UI | React 19 + TypeScript + Vite |
| Styling | Tailwind + CSS design tokens |
| State | Zustand |
| Routing | React Router (HashRouter) |
| AI | Google Gemini (`@google/genai`) |
| Hosting | Firebase Hosting |
| E2E | Playwright |
| CI/CD | GitHub Actions (`cicd-grok.yml`) |

**All application code lives under `src/`.** See [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Quick start

```bash
npm install
npm run dev
```

Build & preview:

```bash
npm run build
npm run preview
```

E2E:

```bash
npx playwright install chromium
npm run test:e2e
```

---

## Routes

| Path | Module |
|------|--------|
| `/` | Dashboard (theme-driven) |
| `/diagnostics` | Diagnostics |
| `/logbook` | Maintenance log |
| `/tuning` | ECU tuning |
| `/ai-engine` | AI Engine |
| `/ar-assistant` | AR Assistant |
| `/security` | Security |
| `/hedera` | Hedera DLT |
| `/race-pack` | Race Pack |
| `/accessories` | Accessories |
| `/appearance` | Appearance |
| `/training` | Training / Live Tuning |

---

## Design system

Themes and materials are controlled via `AppearanceContext` and reflected as `data-theme` / `data-material` on the document. Neon glassmorphism, Orbitron display type, and connection-status frame glows are first-class.

---

## Contributing rule

1. New code → `src/` only  
2. Do not import from root `components/`, `pages/`, etc.  
3. Keep claims in this README honest to what ships  

---

*CartelWorx · KC Speed Shop · Performance first*
