# Story 1.1: Initialize Monorepo & Project Scaffold

Status: done

## Story

As a developer,
I want the project repository scaffolded with an npm workspaces monorepo, frontend (Vite + React 18 + TypeScript) and backend (Express v5 + TypeScript + Prisma) packages initialized,
so that all subsequent stories have a consistent, working foundation to build on.

## Acceptance Criteria

1. Running `npm install` at the project root installs all workspace dependencies without errors.
2. The root `package.json` contains `"workspaces": ["frontend", "backend"]`.
3. Running `npm run dev` in `frontend/` starts Vite on port 5173 serving the React TypeScript template without errors.
4. Running `npm run dev` in `backend/` starts ts-node-dev without TypeScript compilation errors.
5. The following paths exist: `frontend/`, `backend/`, `backend/prisma/schema.prisma`, `.env.example`, `.gitignore`.
6. `.gitignore` excludes `.env` (never committed) and `node_modules/` at all levels.

## Tasks / Subtasks

- [x] Task 1: Initialize root npm workspaces (AC: #1, #2)
  - [x] Run `npm init -y` at project root
  - [x] Edit root `package.json`: add `"workspaces": ["frontend", "backend"]` and a root-level `"private": true`
  - [x] Add root `.gitignore` covering `node_modules/`, `.env`, `dist/`, build artefacts
  - [x] Create `.env.example` with all known environment variables (see Dev Notes)

- [x] Task 2: Scaffold frontend workspace (AC: #3)
  - [x] Run `npm create vite@latest frontend -- --template react-ts` from project root
  - [x] **CRITICAL:** Verify `frontend/package.json` has `"react": "^18.*"` — downgrade to React 18 if Vite defaults to React 19 (`npm install react@18 react-dom@18 --save --prefix frontend`)
  - [x] Update `frontend/vite.config.ts` to add the `/api` dev proxy (see Dev Notes)
  - [x] Verify `npm run dev` starts Vite on port 5173 without errors

- [x] Task 3: Scaffold backend workspace (AC: #4, #5)
  - [x] Create `backend/` directory
  - [x] Run `npm init -y` in `backend/`
  - [x] Install runtime dependencies: `npm install express@5 helmet cors zod --prefix backend`
  - [x] Install dev dependencies: `npm install -D typescript @types/express @types/node @types/cors ts-node-dev --prefix backend`
  - [x] Create `backend/tsconfig.json` (see Dev Notes for exact content)
  - [x] Create `backend/vitest.config.ts` stub (see Dev Notes)
  - [x] Add scripts to `backend/package.json`: `dev`, `build`, `start`, `test` (see Dev Notes)

- [x] Task 4: Create minimal backend entry points (AC: #4)
  - [x] Create `backend/src/app.ts` — Express factory, no `app.listen()`, no routes yet
  - [x] Create `backend/src/index.ts` — imports app, calls `app.listen(PORT)`
  - [x] Verify `npm run dev` in `backend/` starts ts-node-dev without errors

- [x] Task 5: Initialize Prisma (AC: #5)
  - [x] Run `npx prisma init --datasource-provider postgresql` in `backend/`
  - [x] Verify `backend/prisma/schema.prisma` exists (content will be completed in Story 1.2)
  - [x] Verify `backend/prisma/.gitignore` or root `.gitignore` covers `.env` (Prisma init may create one)

- [x] Task 6: Final validation (AC: all)
  - [x] Run `npm install` from project root — zero errors
  - [x] Confirm `frontend/`, `backend/`, `backend/prisma/schema.prisma`, `.env.example`, `.gitignore` all exist
  - [x] Run `npm run dev` in `frontend/` — Vite starts on :5173
  - [x] Run `npm run dev` in `backend/` — ts-node-dev starts without errors

### Review Findings (AI)

**Date:** 2026-05-01 | **Layers:** Blind Hunter, Acceptance Auditor (Edge Case Hunter: failed — usage limit)

- [x] [Review][Patch] `schema.prisma` datasource block missing `url` field — Prisma CLI and `prisma migrate dev` (Story 1.2) will fail without it [`backend/prisma/schema.prisma`]
- [x] [Review][Patch] `@prisma/client` missing from `backend/package.json` dependencies — runtime query client absent, any Prisma import will fail in production [`backend/package.json`]
- [x] [Review][Patch] `dotenv` not loaded in entry point — `import 'dotenv/config'` missing as first import in `index.ts`; `process.env.PORT` and future `DATABASE_URL` reads rely on external env population [`backend/src/index.ts`]
- [x] [Review][Patch] `prisma` CLI pinned to exact `7.6` with no patch range — security/bug-fix patches (`7.6.x`) will not be picked up by `npm update` [`backend/package.json`]
- [x] [Review][Patch] Root `package.json` has stale `npm init -y` artifact fields (`main`, `directories`, `keywords`, `author`, `license`, `description`) that are meaningless for a private monorepo root [`package.json`]
- [x] [Review][Defer] `prisma.config.ts` `DATABASE_URL` passed as `string | undefined` with no guard [`backend/prisma.config.ts`] — deferred, Story 1.4 owns env config
- [x] [Review][Defer] `helmet` and `cors` listed as dependencies but not applied in `app.ts` [`backend/src/app.ts`] — deferred, Story 1.3 adds middleware and routes
- [x] [Review][Defer] `CORS_ORIGIN` env var defined in `.env.example` but not consumed anywhere [`.env.example`] — deferred, Story 1.3 concern

## Dev Notes

### Tech Stack — Exact Versions (NON-NEGOTIABLE)

| Technology | Version | Notes |
|---|---|---|
| Node.js | 22 LTS | Runtime for backend and build tooling |
| React | **18 LTS** | NOT React 19 — avoids experimental patterns |
| Vite | 8 | Comes via `npm create vite@latest` |
| Express | **v5** | `express@5` — not v4 |
| TypeScript | Latest stable | Throughout — frontend and backend |
| Prisma | 7.6 | ORM — init only in this story |
| ts-node-dev | Latest stable | Backend dev watch mode |

**React 18 enforcement:** As of 2026, `npm create vite@latest` may scaffold React 19. After scaffolding, check `frontend/package.json`. If `react` is `^19.*`, run:
```bash
npm install react@18 react-dom@18 --save --prefix frontend
npm install -D @types/react@18 @types/react-dom@18 --prefix frontend
```

### Root `package.json` Structure

```json
{
  "name": "todo-app",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["frontend", "backend"],
  "scripts": {
    "install:all": "npm install"
  }
}
```

### `.env.example` Content

Create at project root. All variables the full application needs — no production secrets, illustrative values only:

```
# Backend
DATABASE_URL=postgresql://postgres:password@localhost:5432/todos
DATABASE_URL_TEST=postgresql://postgres:password@localhost:5432/todos_test
PORT=3001
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### `.gitignore` Content

```
# Dependencies
node_modules/
**/node_modules/

# Environment
.env
**/.env

# Build outputs
dist/
build/
.next/

# Prisma
backend/prisma/migrations/*.sql.bak

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
```

### `frontend/vite.config.ts` — Add API Proxy

After Vite scaffolding, update `vite.config.ts` to add the dev proxy. The proxy forwards all `/api` requests to the backend during local development:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

This is the ONLY place the backend URL appears in frontend code. Never hardcode `http://localhost:3001` anywhere else in `frontend/`.

### `backend/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### `backend/package.json` Scripts

```json
{
  "name": "backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

### `backend/vitest.config.ts` Stub

The backend MUST have its own Vitest config — it does NOT share `frontend/vite.config.ts`. Create this now even though tests are written in Stories 1.3 and 2.8:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
})
```

Install vitest as a backend devDependency: `npm install -D vitest --prefix backend`

### `backend/src/app.ts` — Minimal Express Factory

This file exports the Express app instance. It must NOT call `app.listen()` — this separation is required for testability (Vitest imports the app without starting a server):

```typescript
import express from 'express'

export const app = express()

app.use(express.json())

// Routes will be registered in Story 1.3
```

### `backend/src/index.ts` — Server Bootstrap

This is the ONLY file that calls `app.listen()`:

```typescript
import { app } from './app'

const PORT = parseInt(process.env.PORT || '3001', 10)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
```

### Project Structure Notes

This story creates the foundational structure. Later stories add to it — never move or rename established paths:

```
todo-app/                            ← project root
├── package.json                     ← workspaces: ["frontend", "backend"]
├── .env.example                     ← created here; completed in Story 1.4
├── .gitignore
├── frontend/                        ← Vite react-ts scaffold
│   ├── vite.config.ts               ← updated with /api proxy
│   └── src/ ...
└── backend/
    ├── package.json
    ├── tsconfig.json
    ├── vitest.config.ts             ← stub created here
    ├── prisma/
    │   └── schema.prisma            ← from prisma init; model added in Story 1.2
    └── src/
        ├── index.ts                 ← ONLY file calling app.listen()
        └── app.ts                   ← Express factory (no listen, no routes yet)
```

**Directories deferred to later stories:**
- `backend/src/routes/` — Story 1.3
- `backend/src/middleware/` — Story 1.3
- `backend/src/lib/` — Story 1.2 (Prisma singleton)
- `e2e/` — Story 3.3
- `docker-compose.yml` — Story 1.4 (skeleton) / Story 3.2 (production)
- `frontend/src/components/`, `hooks/`, `api/` — Epic 2

### Architecture Anti-Patterns to Avoid

- ❌ `npm create vite@latest` and accepting React 19 without verifying — must be React 18
- ❌ `express@4` — must be `express@5`
- ❌ Putting `app.listen()` in `app.ts` — must only be in `index.ts`
- ❌ Using `nodemon` instead of `ts-node-dev`
- ❌ `prisma db push` — never; use `prisma migrate dev` (Story 1.2)
- ❌ Frontend sharing Vite config with backend tests — backend must have its own `vitest.config.ts`
- ❌ Hardcoding `http://localhost:3001` in frontend — use the Vite proxy only

### References

- Architecture — Starter Template: `_bmad-output/planning-artifacts/architecture.md#Starter-Template-Evaluation`
- Architecture — Initialization Commands: `_bmad-output/planning-artifacts/architecture.md#Initialization-Commands`
- Architecture — Backend Structure: `_bmad-output/planning-artifacts/architecture.md#Backend-Structure`
- Architecture — Frontend Structure: `_bmad-output/planning-artifacts/architecture.md#Frontend-Structure`
- Architecture — Gap Analysis (vitest.config.ts): `_bmad-output/planning-artifacts/architecture.md#Gap-Analysis-Results`
- Architecture — Enforcement Guidelines: `_bmad-output/planning-artifacts/architecture.md#Enforcement-Guidelines`
- Epics — Story 1.1: `_bmad-output/planning-artifacts/epics.md#Story-1.1`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Vite scaffolded React 19 by default → downgraded to React 18 + @types/react@18 per story spec
- Prisma 7.6 init creates `prisma.config.ts` + `backend/.env` (covered by root `**/.env` gitignore rule)
- `dotenv` added as backend dependency for `prisma.config.ts` imports

### Completion Notes List

- AC#1 ✅ `npm install` at root completes without errors
- AC#2 ✅ Root `package.json` has `"workspaces": ["frontend", "backend"]` and `"private": true`
- AC#3 ✅ `npm run dev` in `frontend/` → Vite v8 on :5173 (React 18.3.1)
- AC#4 ✅ `npm run dev` in `backend/` → ts-node-dev v2 starts, "Server running on port 3001"
- AC#5 ✅ All required paths exist: `frontend/`, `backend/`, `backend/prisma/schema.prisma`, `.env.example`, `.gitignore`
- AC#6 ✅ Root `.gitignore` covers `.env` and `**/node_modules/` at all levels

### File List

- `package.json` (created)
- `.gitignore` (created)
- `.env.example` (created)
- `frontend/` (scaffolded via `npm create vite@latest`)
- `frontend/vite.config.ts` (updated — added port 5173 + /api proxy)
- `frontend/package.json` (updated — React 18.3.1, @types/react@18)
- `backend/package.json` (created — express@5, ts-node-dev, vitest, prisma@7.6, dotenv)
- `backend/tsconfig.json` (created)
- `backend/vitest.config.ts` (created)
- `backend/prisma.config.ts` (created by prisma init)
- `backend/prisma/schema.prisma` (created by prisma init)
- `backend/.env` (created by prisma init — excluded from git via `**/.env`)
- `backend/.gitignore` (created by prisma init)
- `backend/src/app.ts` (created)
- `backend/src/index.ts` (created)

## Change Log

- 2026-04-30: Story implemented — monorepo scaffold created with npm workspaces, Vite + React 18 frontend, Express v5 + ts-node-dev + Prisma 7.6 backend
