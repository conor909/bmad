---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments: ['prd.md']
workflowType: 'architecture'
project_name: 'bmad'
user_name: 'Conor'
date: '2026-04-30'
status: 'complete'
completedAt: '2026-04-30'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
18 requirements across 5 categories:
- Todo Management (FR1–5): Full lifecycle CRUD — create with auto-timestamp, toggle completion, delete
- Display & List (FR6–8): Single unified list, visual active/completed distinction, full text readable
- Application States (FR9–13): Empty, loading, and error states; retry without reload; partial failure resilience (other todos remain usable)
- Data Persistence & API (FR14–15): Durable server-side persistence, full CRUD REST API
- Layout & Accessibility (FR16–18): Responsive mobile/desktop, keyboard navigation, non-color completion distinction

**Non-Functional Requirements:**
- Performance: API ops < 500ms; initial load < 2s; UI actions reflect instantly (no per-action spinner)
- Security: HTTPS only; no sensitive data in v1; API must support per-user isolation when auth is added
- Reliability: Transient errors recovered without page reload; no data corruption on partial failure
- Accessibility: Fully keyboard operable; WCAG-compatible status signalling

**Scale & Complexity:**
- Primary domain: Full-stack web application (SPA + REST API)
- Complexity level: Low
- Estimated architectural components: Frontend SPA, REST API server, persistence layer

### Technical Constraints & Dependencies

- Client-side SPA rendering only — no SSR, no SEO requirements
- No websockets, service workers, or offline mode
- Modern evergreen browsers only (Chrome, Firefox, Safari, Edge)
- Auth must be addable without rework: routing, API structure, and data model must not assume a single global user
- No shared global state — per-user data isolation required at the data model level

### Cross-Cutting Concerns Identified

- **Optimistic UI / instant feedback**: Actions must feel instant; requires either optimistic updates with rollback or guaranteed sub-100ms API responses
- **Error boundary design**: Client must distinguish transient errors (retry) from permanent errors; partial failure must not reset loaded state
- **Auth-readiness**: User ID field in data model; API routes structured for `/users/:id/todos` or equivalent even if unenforced in v1
- **Accessibility**: Semantic HTML, keyboard event handling, and non-color status signals must be considered at component design time
- **Responsive layout**: Single layout system working across mobile and desktop breakpoints

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application: client-side SPA + dedicated REST API backend, containerised via Docker Compose. Clean frontend/backend separation chosen over full-stack frameworks (Next.js, Remix) because the PRD explicitly requires client-side-only rendering with no SSR, and Docker containerisation works more cleanly with independently deployable services.

### Starter Options Considered

| Option | Verdict |
|---|---|
| Next.js | Rejected — SSR overhead not required; mixes concerns |
| T3 Stack (Next + tRPC + Prisma) | Rejected — tRPC adds complexity not justified by scope |
| Third-party Vite + Express starters | Rejected — maintenance risk; opinionated in ways we don't need |
| Scaffold from first principles (Vite + Express) | **Selected** — minimal, current, fully understood |

### Selected Starter: Scaffold from first principles

**Rationale:** A low-complexity greenfield CRUD app with explicit "no experimental libraries" constraint is best served by well-understood primitives scaffolded clean. Third-party full-stack starters introduce maintenance uncertainty and hidden opinions; first-principles scaffolding gives us exactly what we need and nothing we don't.

**Initialization Commands:**

```bash
# Root monorepo
npm init -y
# Add to package.json: "workspaces": ["frontend", "backend"]

# Frontend
npm create vite@latest frontend -- --template react-ts

# Backend
mkdir backend && cd backend && npm init -y
npm install express@5 && npm install -D typescript @types/express @types/node ts-node-dev

# ORM
cd backend && npx prisma init --datasource-provider postgresql
```

**Architectural Decisions Provided by Scaffold:**

**Language & Runtime:**
- TypeScript throughout — frontend and backend share one language
- Node.js 22 LTS (current LTS as of April 2026)
- React 18 LTS (not React 19 — avoids experimental patterns per PRD constraint)

**Styling Solution:**
- CSS Modules (included in Vite react-ts template) — sufficient for a todo app; no additional dependency needed

**Build Tooling:**
- Frontend: Vite 8 — HMR in dev, optimised bundle for production
- Backend: ts-node-dev in dev, tsc for production build

**Testing Framework:**
- Unit/Integration: Vitest (shares Vite config, zero additional setup cost)
- E2E: Playwright (explicitly required by PRD)

**ORM & Database:**
- Prisma 7.6 — TypeScript-first, migrations built in, schema-as-code
- PostgreSQL 17 (postgres:17 Docker image — stable, auth-ready, production-grade)

**Code Organization:**
```
project-root/
├── frontend/          # Vite + React 18 + TypeScript SPA
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── api/       # API client layer
│   └── vite.config.ts
├── backend/           # Express v5 + TypeScript + Prisma
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── prisma/
│   └── prisma/schema.prisma
├── e2e/               # Playwright tests
├── docker-compose.yml
├── package.json       # npm workspaces root
└── .env.example
```

**Development Experience:**
- npm workspaces monorepo — single `npm install` at root, shared scripts
- Vite HMR for instant frontend feedback
- ts-node-dev for backend watch mode with TypeScript
- docker-compose.yml for full-stack local dev and E2E test runs

**Note:** Project scaffolding using these commands is the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Already Decided by Starter Scaffold:**
- Language: TypeScript throughout (frontend + backend)
- Frontend framework: React 18 + Vite 8
- Backend runtime: Node.js 22 LTS + Express v5
- ORM: Prisma 7.6 + PostgreSQL 17
- Testing: Vitest (unit/integration) + Playwright (E2E)
- Monorepo: npm workspaces

**Critical Decisions (block implementation):**
- Data model schema and migration strategy
- API URL structure and error envelope
- Frontend server-state management approach
- Input validation and security middleware

**Deferred Decisions (post-MVP):**
- Authentication implementation (JWT vs session — deferred, but structure is auth-ready)
- Rate limiting (not required for v1 single-user scope)
- CI/CD pipeline (not specified in PRD)
- Monitoring and logging beyond health check

---

### Data Architecture

**Todo Data Model (Prisma schema):**
```prisma
model Todo {
  id        String   @id @default(cuid())
  text      String
  completed Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  userId    String?  // nullable — auth-ready, unenforced in v1
}
```
- `cuid()` chosen over `uuid()` — shorter, URL-safe, sortable
- `userId` is nullable and unenforced in v1; adding auth requires only making it required + adding the User model
- `updatedAt` included for future audit/sync use cases

**Migration Strategy:** Prisma Migrate (not `db push`)
- `prisma migrate dev` generates versioned SQL migration files
- Provides full audit trail; production-safe
- `db push` is prototyping-only; ruled out for a BMAD proof-of-concept that demonstrates production practices

**Caching:** None in v1 — PostgreSQL is fast enough for single-user CRUD; adding caching would be premature optimisation

---

### Authentication & Security

**Input Validation:** Zod 3
- TypeScript-first schema validation on all API request bodies
- Shared types between validation schema and TypeScript interfaces
- Returns structured 400 errors on invalid input
- Install: `npm install zod`

**HTTP Security Headers:** Helmet.js
- Single middleware call covers XSS, clickjacking, MIME sniffing, and other OWASP headers
- Directly addresses PRD security requirement for XSS protection
- Install: `npm install helmet`

**CORS:** cors middleware
- Configured to allow only the frontend origin (via env var)
- `CORS_ORIGIN=http://localhost:5173` in dev
- Install: `npm install cors && npm install -D @types/cors`

**Auth-Ready API Structure:**
- All routes namespaced under `/api/v1/` — ready for `/api/v1/users/:id/todos` when auth is added
- Auth middleware slot reserved in Express app setup (commented placeholder)
- No global state — each operation is scoped in a way that a `userId` filter can be added without restructuring

---

### API & Communication Patterns

**REST API Design:**

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/health` | Health check — returns `{ status: "ok", timestamp }` |
| GET | `/api/v1/todos` | Fetch all todos (ordered by createdAt desc) |
| POST | `/api/v1/todos` | Create todo — body: `{ text: string }` |
| PATCH | `/api/v1/todos/:id` | Update todo — body: `{ text?: string, completed?: boolean }` |
| DELETE | `/api/v1/todos/:id` | Delete todo — returns 204 No Content |

**HTTP Status Codes:**
- `200` — GET, PATCH success
- `201` — POST success (created)
- `204` — DELETE success (no body)
- `400` — Validation error (Zod)
- `404` — Todo not found
- `500` — Unexpected server error

**Error Response Envelope:**
```json
{ "error": "Descriptive message", "code": "VALIDATION_ERROR" }
```
- Consistent shape across all error responses
- `code` field is machine-readable — safe to switch on in the client

**Success Responses:** Direct objects/arrays (no `{ data: ... }` wrapper) — keeps responses minimal

**API Documentation:** JSDoc comments on route handlers only — no OpenAPI/Swagger in v1

---

### Frontend Architecture

**Server State Management:** TanStack Query v5 (React Query)
- Rationale: FR9–FR13 (loading/error/empty/retry/partial failure) are exactly the problem TanStack Query solves. useState+useEffect for async server state produces scattered, error-prone flag management. TanStack Query centralises it cleanly.
- Install: `npm install @tanstack/react-query`
- Usage: single `useTodos` custom hook wraps all query + mutation logic

**HTTP Client:** Native `fetch` API (no axios) — sufficient for simple CRUD, keeps deps minimal

**Component Architecture:**
```
src/
├── components/
│   ├── TodoList.tsx       # List container + empty/loading/error states
│   ├── TodoItem.tsx       # Single todo row (toggle + delete)
│   └── AddTodoForm.tsx    # Controlled input + submit
├── hooks/
│   └── useTodos.ts        # TanStack Query: list, create, toggle, delete
└── api/
    └── todos.ts           # Typed fetch wrappers
```

**Error Boundaries:** React ErrorBoundary at app root for unexpected render errors; TanStack Query handles async/network error states at the component level

**No client-side router needed** — single view, no routing required

---

### Infrastructure & Deployment

**Docker Strategy:**
- Multi-stage builds for both frontend and backend (per PRD FR17)
  - Build stage: `node:22-alpine` — install deps + compile
  - Production stage: `node:22-alpine` — copy built artefacts only
- Non-root user `node` in all production containers (per PRD)
- HEALTHCHECK directive in each Dockerfile

**docker-compose.yml Structure:**
```yaml
services:
  db:        # postgres:17, named volume for persistence
  backend:   # depends_on db (health), exposes :3001
  frontend:  # depends_on backend, exposes :80 (nginx serving Vite build)
```
- `frontend` served via nginx in production container (nginx:alpine — serves static Vite build, proxies /api to backend)
- Named volumes for PostgreSQL data persistence

**Environment Variables:**
```
DATABASE_URL=postgresql://user:pass@db:5432/todos
PORT=3001
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```
- `.env.example` committed; `.env` gitignored
- All values injectable at container runtime — no hardcoded config

**Health Check Endpoint:** `GET /api/health`
```json
{ "status": "ok", "timestamp": "2026-04-30T..." }
```
- Used by Docker HEALTHCHECK and docker-compose `depends_on` condition

### Decision Impact Analysis

**Implementation Sequence:**
1. Scaffold monorepo + install dependencies
2. Prisma schema + initial migration
3. Express server + health check + CRUD routes + Zod validation
4. React frontend + TanStack Query + component tree
5. Docker multi-stage builds + docker-compose
6. Vitest unit/integration tests
7. Playwright E2E tests

**Cross-Component Dependencies:**
- Frontend `api/todos.ts` shapes must match backend response types (share via a `shared/` workspace package or manual sync)
- Docker health checks gate service startup order
- TanStack Query mutation callbacks must handle the error envelope shape defined in the API layer

## Implementation Patterns & Consistency Rules

### Critical Conflict Points Identified

8 areas where AI agents could independently make different, incompatible choices:
naming conventions, file structure, API response shapes, error handling approach,
loading state flags, test co-location, date serialisation, and TypeScript type sharing.

---

### Naming Patterns

**Database (Prisma Schema):**
- Model names: PascalCase singular — `Todo` not `todos` or `Todos`
- Field names: camelCase — `createdAt`, `userId`, `completed`
- Prisma maps camelCase fields to snake_case columns in PostgreSQL automatically
- Do NOT add `@@map` or `@map` directives unless overriding Prisma defaults

**API Endpoints:**
- Resource names: plural, lowercase — `/api/v1/todos` not `/api/v1/todo`
- Route params: `:id` — `GET /api/v1/todos/:id`
- Query params: camelCase — `?sortBy=createdAt`
- Health check exception: `/api/health` (no version prefix)

**JSON Field Names:**
- camelCase throughout — `createdAt`, `completed`, `userId`
- Never snake_case in JSON responses — `created_at` ❌

**TypeScript / Code:**
- React components: PascalCase files and exports — `TodoItem.tsx`, `export function TodoItem`
- Hooks: camelCase with `use` prefix — `useTodos.ts`, `export function useTodos`
- Utility/API modules: camelCase — `todos.ts`, `errorHandler.ts`
- Types and interfaces: PascalCase — `Todo`, `CreateTodoInput`, `ApiError`
- Variables and functions: camelCase — `const todoList`, `function createTodo`

---

### Structure Patterns

**Test Co-location:**
- Unit and integration tests: co-located with source file
  - `frontend/src/components/TodoItem.tsx` → `frontend/src/components/TodoItem.test.tsx`
  - `backend/src/routes/todos.ts` → `backend/src/routes/todos.test.ts`
- E2E tests: `/e2e/*.spec.ts` at project root — never inside `frontend/` or `backend/`
- Test utilities/fixtures: `frontend/src/__tests__/helpers/` or `backend/src/__tests__/`

**Frontend Structure (strictly follow):**
```
frontend/src/
├── components/     # React components only — no business logic
├── hooks/          # Custom hooks — all TanStack Query logic lives here
├── api/            # Typed fetch wrappers — one file per resource
└── main.tsx        # Entry point + QueryClientProvider setup
```

**Backend Structure (strictly follow):**
```
backend/src/
├── routes/         # Express route handlers — thin, delegate to lib
├── middleware/     # Express middleware (error handler, cors, helmet)
├── lib/            # Prisma client singleton, shared utilities
├── app.ts          # Express app factory (no listen — testable)
└── index.ts        # Server bootstrap — imports app, calls listen
```

---

### Format Patterns

**API Success Responses:**
- Return the resource directly — no wrapper envelope
  - ✅ `[{ id: "...", text: "...", completed: false, createdAt: "..." }]`
  - ❌ `{ data: [...], success: true }`
- DELETE returns `204 No Content` with empty body — never `{ success: true }`

**API Error Responses:**
```typescript
// Always this shape — no exceptions
{ "error": "Human-readable message", "code": "MACHINE_READABLE_CODE" }

// Standard codes:
// VALIDATION_ERROR   — Zod schema failure (400)
// NOT_FOUND          — Resource does not exist (404)
// INTERNAL_ERROR     — Unexpected server error (500)
```

**Date Serialisation:**
- All dates as ISO 8601 strings in JSON — `"2026-04-30T12:00:00.000Z"`
- Never Unix timestamps in API responses
- Frontend displays dates using `new Date(todo.createdAt).toLocaleDateString()`

**TypeScript Types:**
- Define `Todo` type in `frontend/src/api/todos.ts` matching Prisma output shape
- Do NOT import from `@prisma/client` in frontend — types must be manually mirrored
- Backend route handlers use Prisma-generated types directly

---

### Process Patterns

**Error Handling (Backend):**
- All route handlers are async — unhandled promise rejections bubble to global error middleware
- Global error middleware in `backend/src/middleware/errorHandler.ts` formats all errors into the standard envelope
- Zod parse errors caught in middleware and converted to `VALIDATION_ERROR` responses
- No try/catch in individual route handlers — let errors propagate

**Error Handling (Frontend):**
- TanStack Query `error` state handles all async/network errors — never try/catch in components
- Components read `isError` and `error` from query/mutation results
- Retry: `retry: 1` on mutations, `retry: false` on queries (show error immediately)

**Loading States:**
- Use TanStack Query flags only — never manual `isLoading` useState
  - Initial list fetch: `isLoading` (true only on first load, no cached data)
  - Mutations (create/toggle/delete): `isPending`
  - Per-item loading: track pending mutation via `variables` from `useMutation`

**Optimistic Updates:**
- Apply for toggle and delete operations only
- Pattern: `onMutate` → update cache → `onError` → rollback → `onSettled` → invalidate
- Create is NOT optimistic — needs server-assigned `id` and `createdAt`

**Validation Timing:**
- Server-side only with Zod — no duplicate client-side validation schemas
- Frontend prevents empty submission via HTML `required` attribute only
- Zod schemas defined in `backend/src/routes/` alongside the route that uses them

---

### Enforcement Guidelines

**All AI Agents MUST:**
- Use camelCase for all JSON field names — never snake_case in API responses
- Co-locate tests with source files — never create a separate top-level `__tests__` directory inside `frontend/` or `backend/`
- Use the standard error envelope `{ error, code }` — never invent alternative shapes
- Use TanStack Query for all server state — never useState+useEffect for API data
- Run Prisma migrations (`prisma migrate dev`) — never `prisma db push` for schema changes
- Use `node:22-alpine` as the base image — never `node:latest` or unversioned tags
- Separate `app.ts` (Express factory) from `index.ts` (server bootstrap) — keeps backend testable

**Anti-Patterns (never do these):**
- ❌ `snake_case` in JSON: `{ "created_at": "..." }` — use `createdAt`
- ❌ Axios: `import axios from 'axios'` — use native fetch
- ❌ Wrapping success responses: `{ data: todo, success: true }`
- ❌ console.log in production code — remove before commit
- ❌ Hardcoding ports or URLs: `fetch('http://localhost:3001/...')` — use env vars
- ❌ Importing Prisma client in frontend code

## Project Structure & Boundaries

### Requirements to Structure Mapping

| FR Category | Files |
|---|---|
| Todo Management (FR1–5) | `backend/src/routes/todos.ts`, `backend/prisma/schema.prisma` |
| Display & List (FR6–8) | `frontend/src/components/TodoList.tsx`, `TodoItem.tsx` |
| Application States (FR9–13) | `frontend/src/hooks/useTodos.ts` (TanStack Query) |
| Data Persistence & API (FR14–15) | `backend/src/routes/todos.ts`, `backend/src/lib/prisma.ts` |
| Infrastructure (FR16–18) | `backend/src/routes/health.ts`, `docker-compose.yml`, `*/Dockerfile` |
| Layout & Accessibility (FR19–21) | `frontend/src/components/`, `frontend/src/App.css` |

---

### Complete Project Directory Structure

```
todo-app/
├── package.json                     # npm workspaces root: ["frontend","backend"]
├── .env.example                     # All env vars documented with examples
├── .env                             # gitignored — never committed
├── .gitignore
├── docker-compose.yml               # Orchestrates db + backend + frontend
├── README.md
│
├── frontend/                        # Vite 8 + React 18 + TypeScript SPA
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts               # Vitest config lives here too
│   ├── index.html
│   ├── Dockerfile                   # Multi-stage: node:22-alpine build → nginx:alpine serve
│   ├── nginx.conf                   # Serves /dist, proxies /api → backend:3001
│   └── src/
│       ├── main.tsx                 # Entry: React root + QueryClientProvider
│       ├── App.tsx                  # Root component + React ErrorBoundary
│       ├── App.css                  # Global styles, CSS variables, responsive breakpoints
│       ├── components/
│       │   ├── TodoList.tsx         # FR6,9,10,11,13: list + loading/empty/error states
│       │   ├── TodoList.test.tsx
│       │   ├── TodoItem.tsx         # FR2,3,4,7,8,21: row, toggle, delete, visual state
│       │   ├── TodoItem.test.tsx
│       │   ├── AddTodoForm.tsx      # FR1: controlled input + submit (keyboard: FR20)
│       │   └── AddTodoForm.test.tsx
│       ├── hooks/
│       │   ├── useTodos.ts          # FR9–13: TanStack Query — list + all mutations
│       │   └── useTodos.test.ts
│       └── api/
│           └── todos.ts             # Typed fetch wrappers + Todo type definition
│
├── backend/                         # Express v5 + TypeScript + Prisma
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile                   # Multi-stage: node:22-alpine build → production
│   ├── prisma/
│   │   ├── schema.prisma            # Todo model (id, text, completed, createdAt, updatedAt, userId?)
│   │   └── migrations/              # Versioned SQL — generated by prisma migrate dev
│   └── src/
│       ├── index.ts                 # Bootstrap: import app, call app.listen()
│       ├── app.ts                   # Express factory: middleware + routes (no listen — testable)
│       ├── routes/
│       │   ├── todos.ts             # FR1–5,14–15: CRUD handlers + Zod schemas
│       │   ├── todos.test.ts        # Integration tests (real Prisma, test DB)
│       │   ├── health.ts            # FR16: GET /api/health → { status, timestamp }
│       │   └── health.test.ts
│       ├── middleware/
│       │   ├── errorHandler.ts      # Global Express error middleware → standard envelope
│       │   └── errorHandler.test.ts
│       └── lib/
│           └── prisma.ts            # Prisma client singleton (import this everywhere)
│
└── e2e/                             # Playwright E2E tests (project root)
    ├── playwright.config.ts         # baseURL from env, runs against docker-compose stack
    ├── create-todo.spec.ts          # FR1, FR9 (empty state → create → list populates)
    ├── complete-todo.spec.ts        # FR2, FR3, FR7 (toggle + visual state change)
    ├── delete-todo.spec.ts          # FR4 (delete → item removed)
    ├── empty-state.spec.ts          # FR9 (fresh load → empty state visible)
    └── error-handling.spec.ts       # FR11, FR12, FR13 (network error → retry → recovery)
```

---

### Architectural Boundaries

**API Boundary (frontend ↔ backend):**
- Contract defined in `frontend/src/api/todos.ts` — all fetch calls + `Todo` type
- Backend response shapes must stay in sync with this file manually
- All API calls go to `/api/*` — nginx proxies to backend in production, Vite dev proxy in development
- Vite dev proxy config: `vite.config.ts` → `server.proxy: { '/api': 'http://localhost:3001' }`

**Data Boundary (backend ↔ database):**
- All database access through `backend/src/lib/prisma.ts` singleton — never instantiate Prisma elsewhere
- Schema changes require a new migration file — never raw SQL against the database
- `userId` field exists but is unenforced in v1 — Prisma queries do not filter by it yet

**Container Boundary (service ↔ service):**
- `frontend` → `backend` over internal Docker network via `http://backend:3001`
- `backend` → `db` via `DATABASE_URL` env var
- No direct `frontend` → `db` communication — ever

---

### Integration Points

**Internal Communication:**
```
Browser → nginx:80          → serves /dist (static)
Browser → nginx:80/api/*    → proxies to backend:3001/api/*
backend:3001                → db:5432 (Prisma / PostgreSQL)
```

**Data Flow (create todo example):**
```
AddTodoForm submit
  → useTodos createTodo mutation (TanStack Query)
    → api/todos.ts: POST /api/v1/todos { text }
      → nginx proxy → backend route handler
        → Zod validation
          → prisma.todo.create()
            → PostgreSQL INSERT
          ← { id, text, completed, createdAt, updatedAt }
      ← 201 Created
    ← TanStack Query invalidates 'todos' query
  → TodoList re-renders with new item at top
```

**Error Flow (network failure example):**
```
useTodos mutation fails (network error)
  → TanStack Query sets isError: true, retry: 1
  → TodoItem shows inline error + retry button (FR12)
  → Rest of todo list remains unchanged (FR13)
  → User clicks retry → mutation re-runs
```

---

### Development Workflow

**Local dev (no Docker):**
```bash
docker-compose up db                  # database only
cd backend && npm run dev             # ts-node-dev on :3001
cd frontend && npm run dev            # Vite HMR on :5173, proxies /api → :3001
```

**Full stack (Docker):**
```bash
docker-compose up --build             # db + backend + frontend at http://localhost:80
```

**E2E tests:**
```bash
docker-compose up --build -d
npx playwright test --config e2e/playwright.config.ts
```

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All 9 technology pairs validated as compatible. React 18 + TanStack Query v5 is a hard compatibility requirement (TQ v5 requires React 18+) — confirmed satisfied. Express v5 requires Node 18+ — Node 22 LTS satisfies this. No contradictions found across the full decision set.

**Pattern Consistency:**
Naming conventions (camelCase JSON, PascalCase components, camelCase hooks) are consistent across frontend, backend, and database layers. Error handling pattern (Zod → error middleware → standard envelope) flows coherently from validation to wire format to client consumption. TanStack Query is used exclusively for server state — no mixed approaches.

**Structure Alignment:**
`app.ts` / `index.ts` separation enables Vitest integration tests to import the Express app without starting a server. E2E tests at project root are independent of both frontend and backend build tooling. nginx proxy pattern aligns exactly with the Docker container boundary decisions.

---

### Requirements Coverage Validation ✅

**Functional Requirements (21/21 covered):**

| FR | Requirement | Architectural Support |
|---|---|---|
| FR1 | Create todo | `POST /api/v1/todos` + `AddTodoForm.tsx` |
| FR2 | Mark complete | `PATCH /api/v1/todos/:id` + `TodoItem.tsx` |
| FR3 | Unmark complete | Same PATCH endpoint (toggle) |
| FR4 | Delete todo | `DELETE /api/v1/todos/:id` + `TodoItem.tsx` |
| FR5 | Auto-timestamp | Prisma `@default(now())` on `createdAt` |
| FR6 | View all todos | `GET /api/v1/todos` + `TodoList.tsx` |
| FR7 | Visual distinction | `TodoItem.tsx` CSS Modules class variants |
| FR8 | Read full text | `TodoItem.tsx` renders `todo.text` |
| FR9 | Empty state | `TodoList.tsx` checks `todos.length === 0` |
| FR10 | Loading state | TanStack Query `isLoading` in `TodoList.tsx` |
| FR11 | Error state | TanStack Query `isError` in `TodoList.tsx` |
| FR12 | Retry without reload | TanStack Query retry + manual retry trigger |
| FR13 | Partial failure resilience | Optimistic update rollback in `useTodos.ts` |
| FR14 | Durable persistence | PostgreSQL + Prisma Migrate |
| FR15 | REST API CRUD | Express v5 route handlers |
| FR16 | Health check endpoint | `GET /api/health` in `health.ts` |
| FR17 | docker-compose up | `docker-compose.yml` + both Dockerfiles |
| FR18 | Env var config | `.env.example` + no hardcoded values |
| FR19 | Responsive layout | CSS Modules breakpoints in `App.css` |
| FR20 | Keyboard navigation | Semantic HTML + keyboard handlers in components |
| FR21 | Non-color status | Strikethrough/icon alongside colour in `TodoItem.tsx` |

**Non-Functional Requirements:**
- Performance: Express + Prisma + PostgreSQL routinely sub-50ms for simple CRUD ✅
- Security XSS/injection: Helmet headers + Zod server-side validation ✅
- Security HTTPS: Deferred to reverse proxy / infrastructure layer (acceptable for POC) ⚠️
- Auth-readiness: `userId` field nullable + `/api/v1/` namespace + no global state ✅
- Reliability: TanStack Query error handling + optimistic rollback ✅
- WCAG 2.1 AA: Semantic HTML + non-colour status distinction (implementation responsibility) ✅
- Testing 70% coverage: Vitest co-located tests across all source files ✅
- E2E 5+ tests: 5 Playwright spec files defined, covering all PRD journeys ✅
- Docker non-root: `USER node` directive pattern documented for both Dockerfiles ✅

---

### Gap Analysis Results

**Minor Gaps (non-blocking):**

1. **Backend Vitest config** — `backend/` needs its own `vitest.config.ts` since it does not share the frontend Vite config. Add `backend/vitest.config.ts` to the project tree.

2. **Test database URL** — Integration tests need `DATABASE_URL_TEST` in `.env.example` to avoid running against the dev database.

3. **HTTPS termination** — Production HTTPS handled by reverse proxy in front of nginx. Acceptable for a POC; note for production deployment.

**No critical gaps.** All 21 FRs covered. All critical decisions documented.

---

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

---

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High — all decisions made, all requirements traced, all conflict points addressed, stack is well-understood and battle-tested.

**Key Strengths:**
- Single-language stack (TypeScript end-to-end) eliminates context switching
- TanStack Query directly solves the PRD's most complex frontend requirements (FR9–13)
- `app.ts`/`index.ts` separation makes the backend fully testable without a running server
- Optimistic updates for toggle/delete satisfy the "no loading spinner" NFR elegantly
- Auth-readiness baked in from day one with zero v1 implementation cost

**Areas for Future Enhancement:**
- HTTPS termination via reverse proxy (nginx/Caddy) when deploying beyond local
- Rate limiting middleware (express-rate-limit) when auth is added
- Shared TypeScript workspace package (`packages/shared`) to eliminate manual type mirroring
- OpenAPI spec generation once the API stabilises

---

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently — naming conventions and error shapes are non-negotiable
- Respect project structure and boundaries — no files outside the defined tree
- Refer to this document for all architectural questions before making independent decisions

**First Implementation Story:**
```bash
# Scaffold the monorepo
npm init -y
# Edit package.json to add workspaces: ["frontend", "backend"]
npm create vite@latest frontend -- --template react-ts
mkdir backend && cd backend && npm init -y
```
