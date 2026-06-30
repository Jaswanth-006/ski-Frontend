# ski-frontend

Web dashboard for Ski — React 18 + TypeScript + Vite. The operations cockpit for the
owner and office staff. See the PRDs in the parent `IOC/` workspace: `00-MAIN-PRD`,
`02-FRONTEND-PRD`, `04-IMPLEMENTATION-PLAN`.

> **Status: Phase 0-A (Foundations — Repos & CI/CD).** Skeleton only: the app renders a
> shell and CI runs lint → typecheck → test → build green. Router, role guards, the
> generated API client (orval), and feature modules land in later phases.

## Requirements
- Node 22

## Setup
```bash
npm install
cp .env.example .env
```

## Run
```bash
npm run dev       # http://localhost:5173
```

## Quality gates (same as CI)
```bash
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm test            # vitest
npm run build       # tsc -b && vite build
```

## CI/CD
`.github/workflows/ci.yml` runs on every push/PR to `main`:
`quality` (lint, typecheck, test, build → uploads `web-dist`) → `deploy-dev` (on `main`).

**Deploy:** the `deploy-dev` job posts to a deploy hook. Set the `DEV_DEPLOY_HOOK` repo
secret (e.g. a static-host/CDN deploy hook) under Settings → Secrets → Actions, and a `dev`
GitHub Environment. Until it's set, the step is a green no-op so `main` stays green.

## Layout
```
src/
  main.tsx         # entry
  App.tsx          # Phase 0 shell
  test/setup.ts    # jest-dom matchers for vitest
```
