# CLAUDE.md

This file provides guidance for AI assistants working on the EDOS Analytics Dashboard codebase.

## Project Overview

Healthcare analytics dashboard for Apollo Diagnostics (EDOS - Electronic Diagnostic Order System). It provides executive KPI views, test catalog exploration, pricing intelligence with comparative analysis, and diagnostic center network mapping. The frontend is a React SPA that fetches data from a Cloudflare Worker API backend.

## Tech Stack

- **Framework**: React 19 with TypeScript 5.8
- **Bundler**: Vite 6 (dev server on port 3000)
- **Routing**: React Router DOM 6 with `HashRouter` (routes use `#/path` fragments)
- **Styling**: Tailwind CSS loaded from CDN (`https://cdn.tailwindcss.com`)
- **Charts**: Recharts 3
- **Icons**: Lucide React
- **Package Manager**: npm

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (port 3000, host 0.0.0.0)
npm run build        # Production build via Vite
npm run preview      # Preview production build
```

There are no test, lint, or format commands configured.

## Directory Structure

```
/
├── components/                  # React components
│   ├── ui/                      # Reusable UI primitives
│   │   ├── StatCard.tsx         # KPI stat display card
│   │   └── LoadingSpinner.tsx   # Loading state indicator
│   ├── Layout.tsx               # App shell: sidebar nav + floating controls
│   ├── Dashboard.tsx            # Executive overview page (route: /)
│   ├── TestExplorer.tsx         # Test catalog with filters (route: /tests)
│   ├── PricingIntelligence.tsx  # Pricing analytics (route: /pricing)
│   └── Centers.tsx              # Diagnostic centers (route: /centers)
├── services/
│   └── api.ts                   # API service layer (currently empty)
├── App.tsx                      # Root component with HashRouter + Routes
├── index.tsx                    # React DOM entry point
├── types.ts                     # TypeScript interfaces for domain models
├── index.html                   # HTML entry with Tailwind CDN and importmap
├── vite.config.ts               # Vite config (React plugin, path aliases)
├── tsconfig.json                # TypeScript config (ES2022, bundler resolution)
└── package.json                 # Dependencies and scripts
```

## Architecture

### Routing

Defined in `App.tsx` using `HashRouter`:

| Route       | Component              | Description                    |
|-------------|------------------------|--------------------------------|
| `/`         | `Dashboard`            | Executive KPI overview         |
| `/tests`    | `TestExplorer`         | Test catalog with pagination   |
| `/pricing`  | `PricingIntelligence`  | Pricing analysis & comparison  |
| `/centers`  | `Centers`              | Diagnostic center network      |

All routes are wrapped by `Layout`, which provides the sidebar and floating navigation controls.

### Component Hierarchy

```
App (HashRouter + Routes)
└── Layout (sidebar nav + floating controls)
    ├── Dashboard
    ├── TestExplorer
    ├── PricingIntelligence
    └── Centers
```

### State Management

Local component state only (React `useState` + `useMemo`). No global state library (no Redux, Zustand, or Context providers). Each page component manages its own data fetching, filters, and UI state.

### API Layer

- **Base URL**: `https://edos-analytics-api.shibi-kannan.workers.dev` (hardcoded in components and in `index.html` as `API_BASE`)
- **Fetch pattern**: Direct `fetch()` calls inside `useEffect` hooks within each component
- **`services/api.ts`** exists but is empty; API calls are currently inline in components

Key endpoints consumed:

```
GET /overview                 # KPI metrics
GET /tests?limit=&offset=&... # Test catalog (paginated)
GET /filters/departments      # Department filter options
GET /filters/specimens        # Specimen type filter options
GET /filters/diseases         # Disease filter options
GET /pricing/enriched         # Enriched pricing data
GET /centers                  # Diagnostic centers list
GET /export/tests.csv         # CSV export
```

### Data Models

Defined in `types.ts`:

- `PaginationEnvelope<T>` - Generic paginated response wrapper
- `DiagnosticTest` - Medical test with pricing, TAT, specimen, and clinical fields
- `DiagnosticCenter` - Center code + city
- `PricingEntry` - Test pricing with department and city
- `OverviewItem` - KPI label/value pair

## Code Conventions

### TypeScript

- Target ES2022 with `react-jsx` transform
- Path alias: `@/*` maps to project root (`./`)
- `DiagnosticTest` uses an index signature (`[key: string]: any`) for flexible field access
- Components typed as `React.FC` or `React.FC<Props>`

### Component Patterns

- Functional components with hooks exclusively (no class components)
- One component per file, named exports
- Page-level components are in `components/` root; reusable primitives in `components/ui/`
- `useMemo` for expensive filter/aggregation computations
- `useEffect` for data fetching on mount or filter changes
- `useRef` for DOM references (e.g., click-outside detection on dropdowns)
- Search inputs use 300ms debounce via `setTimeout`/`clearTimeout` in `useEffect`

### Styling

- All styling via Tailwind utility classes (no CSS files, no CSS modules, no styled-components)
- Tailwind loaded from CDN, not installed as a dependency
- Responsive breakpoints: `sm`, `md`, `lg`, `xl`
- Color palette: blue primary, gray neutrals, semantic colors (green/red/orange/purple)
- Card-based layouts with `shadow` and `rounded-xl`

### Git Conventions

Commits follow conventional commit format:
- `feat:` for new features
- `refactor:` for restructuring
- Keep messages concise and descriptive

## Environment Variables

- `GEMINI_API_KEY` - Referenced in `vite.config.ts` (exposed as `process.env.GEMINI_API_KEY` and `process.env.API_KEY`) but not actively used in application code
- Store secrets in `.env.local` (gitignored)

## Not Yet Configured

- No testing framework (no Jest, Vitest, or React Testing Library)
- No linter or formatter (no ESLint, Prettier, or Biome)
- No CI/CD pipeline
- No pre-commit hooks
- `services/api.ts` is empty; API calls are inline in components
