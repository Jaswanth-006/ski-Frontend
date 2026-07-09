# ski-frontend — agent guide

Web dashboard for Ski (LPG distributorship ops). React 18 + TypeScript + Vite, Tailwind +
shadcn/ui, TanStack Query, framer-motion. See `DESIGN_SYSTEM.md` and the PRDs in the parent
`IOC/` workspace (`00-MAIN-PRD`, `02-FRONTEND-PRD`, `04-IMPLEMENTATION-PLAN`).

## UI rules (must follow)
UI work must follow `./DESIGN_SYSTEM.md`. The visual target is `docs/reference/dashboard.html`
— match its look/motion but build in React + TS + Tailwind + shadcn/ui. Never hardcode colors;
use the tokens.

- Shared components live in `src/components/ui/` (shadcn primitives) and `src/components/app/`
  (composites: KpiCard, Gauge, ReconcilePanel, etc.). Pages compose them; build one page per change.
- Money/quantities use `tabular-nums`; render amounts with `<Money>` and `inr()`.
- Respect `prefers-reduced-motion` (via framer-motion `useReducedMotion`).
- Owner-only data (net profit, margins, audit) is gated in the UI and enforced server-side.

## Commands
```bash
npm run dev         # local dev server
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm test            # vitest
npm run build       # tsc -b && vite build
```

## Feature areas (Phase 8 — Cash, Banking & Reporting)
New pages under `src/features/`: `banking/` (banks · accounts · vendors, owner-only),
`deposits/` (money out of cashier box / between accounts), `cashier-box/` (persistent
cash-in-hand), `month-sheet/`. The Day Sheet gained denomination + stock (opening/loaded/
sold/returned/closing) columns and an opening/closing-cash strip; Pricing lives inside
Master Catalog. Reports (8-E) are upcoming. Regenerate the client after backend contract
changes: `npm run gen:api` (reads the vendored `openapi.yaml`).
