# CLAUDE.md

This file provides guidance for AI assistants working on the EDOS Analytics Dashboard codebase.

## Project Overview

Healthcare analytics dashboard for Apollo Diagnostics (EDOS - Electronic Diagnostic Order System). It provides executive KPI views, test catalog exploration, pricing intelligence with comparative analysis, and diagnostic center network mapping. The frontend is a React SPA that fetches data from a Cloudflare Worker API backend. Deployed to Cloudflare Pages.

## Tech Stack

- **Framework**: React 19 with TypeScript 5.7 (strict mode)
- **Bundler**: Vite 6 (dev server on port 3000)
- **Routing**: React Router DOM 7 with `HashRouter` (routes use `#/path` fragments)
- **Styling**: Tailwind CSS 3 (PostCSS build, tree-shaken in production)
- **Charts**: Recharts 2
- **Icons**: Lucide React
- **Package Manager**: npm
- **Deployment**: Cloudflare Pages (static SPA)

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (port 3000, host 0.0.0.0)
npm run build        # TypeScript check + Vite production build
npm run preview      # Preview production build locally
```

Build output goes to `dist/`.

## Directory Structure

```
/
├── components/                  # React components
│   ├── ui/                      # Reusable UI primitives
│   │   ├── StatCard.tsx         # KPI stat display card
│   │   └── LoadingSpinner.tsx   # Loading state indicator
│   ├── ErrorBoundary.tsx        # React error boundary (class component)
│   ├── Layout.tsx               # App shell: sidebar nav + mobile menu + floating controls
│   ├── Dashboard.tsx            # Executive overview page (route: /)
│   ├── TestExplorer.tsx         # Test catalog with filters (route: /tests)
│   ├── PricingIntelligence.tsx  # Pricing analytics (route: /pricing)
│   └── Centers.tsx              # Diagnostic centers (route: /centers)
├── services/
│   └── api.ts                   # Centralized API client (apiFetch + BASE_URL)
├── public/
│   ├── _headers                 # Cloudflare Pages security headers (CSP, X-Frame-Options, etc.)
│   ├── _redirects               # SPA fallback rule for Cloudflare Pages
│   └── favicon.svg              # App favicon
├── App.tsx                      # Root component with ErrorBoundary + HashRouter + Routes
├── index.tsx                    # React DOM entry point (StrictMode)
├── styles.css                   # Tailwind CSS entry (base/components/utilities + custom scrollbar)
├── types.ts                     # TypeScript interfaces for domain models
├── env.d.ts                     # Vite environment variable type declarations
├── index.html                   # HTML entry point
├── vite.config.ts               # Vite config (React plugin, path aliases, chunk splitting)
├── tsconfig.json                # TypeScript config (ES2022, strict, bundler resolution)
├── tailwind.config.js           # Tailwind content paths and theme
├── postcss.config.js            # PostCSS plugins (Tailwind + Autoprefixer)
├── .env                         # Default env vars (VITE_API_BASE_URL)
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

All routes are wrapped by `ErrorBoundary` > `HashRouter` > `Layout`.

### Component Hierarchy

```
ErrorBoundary
└── HashRouter
    └── Layout (sidebar nav + mobile menu + floating controls)
        └── Routes
            ├── Dashboard
            ├── TestExplorer
            ├── PricingIntelligence
            └── Centers
```

### State Management

Local component state only (React `useState` + `useMemo`). No global state library. Each page component manages its own data fetching, filters, and UI state.

### API Layer

- **Base URL**: Configured via `VITE_API_BASE_URL` environment variable (see `.env`)
- **Client**: `services/api.ts` exports `apiFetch<T>(path, signal?)` and `BASE_URL`
- **Pattern**: All components import from `services/api.ts`; data fetching uses `AbortController` for cleanup on unmount
- **Error handling**: try/catch in each component with user-facing error messages

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

- Strict mode enabled in `tsconfig.json`
- Target ES2022 with `react-jsx` transform
- Path alias: `@/*` maps to project root (`./`)
- Vite env types declared in `env.d.ts`
- Components typed as `React.FC` or `React.FC<Props>`

### Component Patterns

- Functional components with hooks exclusively (ErrorBoundary is the one class component)
- One component per file, named exports
- Page-level components are in `components/` root; reusable primitives in `components/ui/`
- `useMemo` for expensive filter/aggregation computations
- `useEffect` with `AbortController` for data fetching on mount or filter changes
- `useRef` for DOM references (e.g., click-outside detection on dropdowns)
- Search inputs use 300ms debounce via `setTimeout`/`clearTimeout` in `useEffect`

### Styling

- All styling via Tailwind utility classes
- Tailwind built via PostCSS (tree-shaken in production builds)
- Custom scrollbar styles in `styles.css`
- Responsive breakpoints: `sm`, `md`, `lg`, `xl`
- Color palette: blue primary, gray neutrals, semantic colors (green/red/orange/purple)
- Card-based layouts with `shadow` and `rounded-xl`

### Git Conventions

Commits follow conventional commit format:
- `feat:` for new features
- `fix:` for bug fixes
- `refactor:` for restructuring
- `docs:` for documentation changes
- Keep messages concise and descriptive

## Environment Variables

- `VITE_API_BASE_URL` - Backend API base URL (required). Set in `.env` for local dev, or as Cloudflare Pages environment variable for deployment
- Store local overrides in `.env.local` (gitignored via `*.local` pattern)

## Cloudflare Pages Deployment

- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Environment variable**: Set `VITE_API_BASE_URL` in Cloudflare Pages dashboard
- **SPA routing**: `public/_redirects` provides fallback to `index.html`
- **Security headers**: `public/_headers` sets CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy

## Not Yet Configured

- No testing framework (no Vitest or React Testing Library)
- No linter or formatter (no ESLint, Prettier, or Biome)
- No CI/CD pipeline
- No pre-commit hooks
