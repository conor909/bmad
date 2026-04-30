---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
---

# bmad - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for bmad, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: User can create a todo item with a text description
FR2: User can mark a todo item as complete
FR3: User can unmark a completed todo item (toggle back to active)
FR4: User can delete a todo item
FR5: System automatically assigns a creation timestamp to each todo item at the time of creation
FR6: User can view all todo items in a single list
FR7: User can visually distinguish active todo items from completed todo items
FR8: User can read the full text description of each todo item in the list
FR9: User sees a meaningful empty state when no todo items exist
FR10: User sees a loading state while todo data is being fetched from the server
FR11: User sees an error state when a server or network operation fails
FR12: User can retry a failed operation without reloading the page
FR13: Existing todo items remain visible and usable when a single operation fails
FR14: System persists todo items durably across browser sessions and page refreshes
FR15: System exposes a REST API supporting create, read, update, and delete operations on todo items
FR16: Backend exposes a health check endpoint that returns current service status
FR17: Application runs in its entirety via `docker-compose up` with no manual steps beyond environment variable configuration
FR18: Application behaviour is configurable per environment (dev/test) via environment variables without code changes
FR19: User can access all application features on both mobile and desktop screen sizes
FR20: User can navigate and operate the application using a keyboard alone
FR21: User can distinguish todo item completion status through visual contrast that does not rely on colour alone

### NonFunctional Requirements

NFR1: All CRUD API operations complete in under 500ms under normal network conditions
NFR2: Initial page load delivers a usable interface in under 2 seconds on a standard broadband connection
NFR3: UI reflects user actions (create, complete, delete) without perceptible delay — no loading spinner required for individual actions
NFR4: All client-server communication transmitted over HTTPS
NFR5: No sensitive user data stored beyond todo content; no auth tokens, passwords, or PII in v1
NFR6: API structure must support per-user data isolation when authentication is added (no shared global state)
NFR7: All user-supplied input sanitised server-side; application must not be vulnerable to XSS or injection attacks
NFR8: Application recovers from transient server errors without a full page reload
NFR9: Failed operations do not corrupt or discard previously loaded todo data
NFR10: On server error, the UI surfaces a recoverable error state, not a crash or blank screen
NFR11: Application meets WCAG 2.1 AA compliance — zero critical violations as measured by automated audit (Lighthouse or axe-core)
NFR12: Application is operable via keyboard without a mouse
NFR13: Completion status communicated through visual means that do not rely on colour alone (e.g., strikethrough, icon, or label alongside colour change)
NFR14: Unit tests cover frontend components and backend business logic using Vitest
NFR15: Integration tests cover each API endpoint (create, read, update, delete, health check)
NFR16: Minimum 70% meaningful code coverage across unit and integration tests combined
NFR17: E2E test suite implemented with Playwright
NFR18: Minimum 5 passing E2E tests covering: create todo, complete todo, delete todo, empty state, error handling
NFR19: E2E tests run against the fully assembled application (not mocks)
NFR20: Separate Dockerfiles for frontend and backend using multi-stage builds
NFR21: Containers run as non-root users
NFR22: Each container exposes a health check directive
NFR23: docker-compose.yml orchestrates all services (db, backend, frontend) with correct networking and volumes
NFR24: All environment-specific values (ports, database URLs, API URLs) supplied via environment variables
NFR25: No hardcoded environment values in application code

### Additional Requirements

- **Starter Template (Epic 1 Story 1):** Scaffold from first principles — no third-party full-stack starter. Initialization commands specified in Architecture.
- TypeScript throughout — frontend (React 18 + Vite 8) and backend (Node.js 22 LTS + Express v5)
- React 18 LTS — not React 19 (avoid experimental patterns per PRD constraint)
- CSS Modules for styling — no additional CSS framework required
- ORM: Prisma 7.6 — use `prisma migrate dev` (never `prisma db push`) for all schema changes
- Database: PostgreSQL 17 via `postgres:17` Docker image
- npm workspaces monorepo — single `npm install` at root
- TanStack Query v5 for all server state management — never useState+useEffect for API data
- Native `fetch` API for HTTP — no axios
- Zod 3 for server-side input validation only — no duplicate client-side validation schemas
- Helmet.js for HTTP security headers
- cors middleware — configured via CORS_ORIGIN env var
- Optimistic updates applied to toggle and delete only — create is NOT optimistic (needs server-assigned id/createdAt)
- Standard error envelope: `{ "error": "Human-readable message", "code": "MACHINE_READABLE_CODE" }`
- `app.ts` / `index.ts` separation in backend — keeps backend testable without a running server
- Test co-location: unit/integration tests alongside source files; E2E at `/e2e/` at project root
- `backend/vitest.config.ts` required — backend does not share frontend Vite config
- `DATABASE_URL_TEST` in `.env.example` for integration tests against a test database
- Vite dev proxy: `/api` → `http://localhost:3001` in `vite.config.ts`
- Production frontend served via nginx:alpine with /api proxied to backend:3001
- Multi-stage Docker builds using `node:22-alpine` as base image — never `node:latest`
- Non-root user `node` in all production containers

### UX Design Requirements

_No UX Design document present for this project._

### FR Coverage Map

FR1: Epic 2 — `POST /api/v1/todos` + `AddTodoForm` component
FR2: Epic 2 — `PATCH /api/v1/todos/:id` + `TodoItem` toggle
FR3: Epic 2 — same PATCH endpoint (toggle back to active)
FR4: Epic 2 — `DELETE /api/v1/todos/:id` + `TodoItem` delete
FR5: Epic 2 — Prisma `@default(now())` on `createdAt` field
FR6: Epic 2 — `GET /api/v1/todos` + `TodoList` component
FR7: Epic 2 — `TodoItem` CSS Modules class variants for active/completed
FR8: Epic 2 — `TodoItem` renders `todo.text` in full
FR9: Epic 2 — `TodoList` checks `todos.length === 0` for empty state
FR10: Epic 2 — TanStack Query `isLoading` flag in `TodoList`
FR11: Epic 2 — TanStack Query `isError` flag in `TodoList`
FR12: Epic 2 — TanStack Query retry + manual retry trigger in `TodoList`
FR13: Epic 2 — optimistic update rollback in `useTodos` preserves list
FR14: Epic 1 — Prisma schema + PostgreSQL migration
FR15: Epic 2 — Express v5 route handlers for all CRUD operations
FR16: Epic 1 — `GET /api/health` in `health.ts`
FR17: Epic 1 (skeleton compose) → Epic 3 (complete multi-stage production compose)
FR18: Epic 1 — `.env.example` + no hardcoded values in any source file
FR19: Epic 2 — responsive CSS breakpoints in `App.css`
FR20: Epic 2 — semantic HTML + keyboard event handlers in components
FR21: Epic 2 — strikethrough + icon alongside colour in `TodoItem`

## Epic List

### Epic 1: Project Foundation
A developer can boot the backend with a working database connection, a responding health check endpoint, and a basic Docker Compose stack — the prerequisite before any feature work begins.

**FRs covered:** FR14, FR16, FR17 (partial), FR18

### Epic 2: Working Todo Application
A user can create, view, complete, and delete todo items through a responsive, accessible, resilient UI — all application states handled (loading, empty, error, retry, partial failure), all core journeys complete, and the implementation verified by unit and integration tests.

**FRs covered:** FR1–FR13, FR15, FR19–FR21

### Epic 3: Production Deployment & E2E Quality
The application is fully containerised with multi-stage Docker builds, deployable via a single `docker-compose up`, and verified end-to-end by a Playwright test suite covering all user journeys.

**FRs covered:** FR17 (complete)

---

## Epic 1: Project Foundation

A developer can boot the backend with a working database connection, a responding health check endpoint, and a basic Docker Compose stack — the prerequisite before any feature work begins.

**FRs covered:** FR14, FR16, FR17 (partial), FR18

### Story 1.1: Initialize Monorepo & Project Scaffold

As a developer,
I want the project repository scaffolded with an npm workspaces monorepo, frontend (Vite + React 18 + TypeScript) and backend (Express v5 + TypeScript + Prisma) packages initialized,
So that all subsequent stories have a consistent, working foundation to build on.

**Acceptance Criteria:**

**Given** a clean directory with Node.js 22 installed
**When** I run `npm install` at the project root
**Then** all workspace dependencies install without errors

**Given** the root `package.json`
**When** I inspect it
**Then** it contains `"workspaces": ["frontend", "backend"]`

**Given** the frontend workspace
**When** I run `npm run dev` in `frontend/`
**Then** Vite starts on port 5173 serving the default React TypeScript template without errors

**Given** the backend workspace
**When** I run `npm run dev` in `backend/`
**Then** ts-node-dev starts the TypeScript backend without compilation errors

**Given** the project root
**When** I inspect the directory structure
**Then** the following paths exist: `frontend/`, `backend/`, `backend/prisma/schema.prisma`, `.env.example`, `.gitignore`

**Given** the `.gitignore`
**When** I inspect it
**Then** `.env` is excluded (never committed) and `node_modules/` is excluded at all levels

---

### Story 1.2: Todo Data Model & Initial Database Migration

As a developer,
I want the Prisma Todo schema defined and the initial migration applied to the database,
So that the persistence layer is ready for CRUD operations and structured to support auth without restructuring.

**Acceptance Criteria:**

**Given** `backend/prisma/schema.prisma`
**When** I inspect the Todo model
**Then** it defines exactly: `id String @id @default(cuid())`, `text String`, `completed Boolean @default(false)`, `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`, `userId String?` (nullable)

**Given** a running PostgreSQL 17 database
**When** I run `npx prisma migrate dev --name init` in `backend/`
**Then** a versioned migration file is created under `backend/prisma/migrations/` and the `Todo` table exists in the database with all expected columns

**Given** `backend/src/lib/prisma.ts`
**When** I inspect it
**Then** it exports a single Prisma client singleton — the only place a `PrismaClient` is instantiated in the backend

**Given** the migration has been applied
**When** I query the database directly
**Then** the `Todo` table is present and matches the schema (no extra columns, no missing columns)

---

### Story 1.3: Express Application Setup with Health Check

As a developer,
I want the Express application factory and server bootstrap separated, with security middleware, global error handling, and a health check endpoint configured,
So that the backend is testable without a running server and all cross-cutting concerns are in place before feature routes are added.

**Acceptance Criteria:**

**Given** `backend/src/app.ts`
**When** I inspect it
**Then** it exports an Express app factory (no `app.listen()` call) with Helmet, CORS, and the global error middleware registered

**Given** `backend/src/index.ts`
**When** I inspect it
**Then** it is the only file that calls `app.listen(PORT)` — it imports the app from `app.ts`

**Given** the backend server is running
**When** I send `GET /api/health`
**Then** I receive `200 OK` with body `{ "status": "ok", "timestamp": "<ISO 8601 string>" }`

**Given** the backend server is running and an unhandled error is thrown in a route
**When** the error propagates to the global error middleware in `backend/src/middleware/errorHandler.ts`
**Then** the response is `{ "error": "<human-readable message>", "code": "<MACHINE_CODE>" }` with the appropriate HTTP status code

**Given** Helmet middleware is registered
**When** I inspect any API response's headers
**Then** security headers are present (e.g., `X-Content-Type-Options`, `X-Frame-Options`)

**Given** CORS middleware is configured with the `CORS_ORIGIN` env var
**When** a request arrives from the allowed origin
**Then** the response includes the correct `Access-Control-Allow-Origin` header

---

### Story 1.4: Environment Configuration & Development Docker Compose

As a developer,
I want all environment variables documented in `.env.example` and a `docker-compose.yml` that boots the database (and backend) for local development,
So that any developer can get the project running with a single command and no undocumented configuration.

**Acceptance Criteria:**

**Given** `.env.example`
**When** I inspect it
**Then** it contains all required variables with example values: `DATABASE_URL`, `PORT`, `CORS_ORIGIN`, `NODE_ENV`, `DATABASE_URL_TEST`

**Given** `.env.example`
**When** I inspect every variable's example value
**Then** no value is a hardcoded production secret — all values are clearly illustrative examples

**Given** `docker-compose.yml`
**When** I run `docker-compose up db`
**Then** a `postgres:17` container starts with a named volume for data persistence and a health check configured

**Given** a `.env` file copied from `.env.example` and correctly filled in
**When** I run `npm run dev` in `backend/`
**Then** the backend connects to PostgreSQL successfully and `GET /api/health` returns `200 OK`

**Given** the backend service in `docker-compose.yml`
**When** I inspect its definition
**Then** it `depends_on` the `db` service with a health condition (starts only after db is healthy)

---

## Epic 2: Working Todo Application

A user can create, view, complete, and delete todo items through a responsive, accessible, resilient UI — all application states handled (loading, empty, error, retry, partial failure), all core journeys complete, and the implementation verified by unit and integration tests.

**FRs covered:** FR1–FR13, FR15, FR19–FR21

### Story 2.1: Todo CRUD API

As a developer,
I want the full suite of Todo REST API endpoints implemented with Zod validation and the standard error envelope,
So that the frontend has a complete, typed contract to build against.

**Acceptance Criteria:**

**Given** the backend server is running with a connected database
**When** I send `POST /api/v1/todos` with body `{ "text": "Buy milk" }`
**Then** I receive `201 Created` with body `{ "id": "<cuid>", "text": "Buy milk", "completed": false, "createdAt": "<ISO string>", "updatedAt": "<ISO string>", "userId": null }`

**Given** one or more todos exist in the database
**When** I send `GET /api/v1/todos`
**Then** I receive `200 OK` with an array of all todos ordered by `createdAt` descending, each in the format above

**Given** a todo with a known `id` exists
**When** I send `PATCH /api/v1/todos/:id` with body `{ "completed": true }`
**Then** I receive `200 OK` with the updated todo object reflecting the change

**Given** a todo with a known `id` exists
**When** I send `DELETE /api/v1/todos/:id`
**Then** I receive `204 No Content` with an empty body

**Given** the backend server is running
**When** I send `POST /api/v1/todos` with an empty body or `{ "text": "" }`
**Then** I receive `400 Bad Request` with body `{ "error": "<message>", "code": "VALIDATION_ERROR" }`

**Given** a request targets a non-existent todo id
**When** I send `PATCH` or `DELETE` to `/api/v1/todos/:id`
**Then** I receive `404 Not Found` with body `{ "error": "<message>", "code": "NOT_FOUND" }`

**Given** all JSON field names in any API response
**When** I inspect them
**Then** all are camelCase (`createdAt`, `userId`) — never snake_case

---

### Story 2.2: Frontend API Client & useTodos Hook

As a developer,
I want a typed API client layer and a `useTodos` hook using TanStack Query that wraps all list and mutation operations,
So that all server state management is centralised and components never manage async data with raw `useState`/`useEffect`.

**Acceptance Criteria:**

**Given** `frontend/src/api/todos.ts`
**When** I inspect it
**Then** it exports typed fetch wrappers for list, create, toggle, and delete operations, and exports the `Todo` type matching the API response shape

**Given** `frontend/src/hooks/useTodos.ts`
**When** I inspect it
**Then** it uses TanStack Query exclusively — no `useState` or `useEffect` for server data — and exports `{ todos, isLoading, isError, createTodo, toggleTodo, deleteTodo }`

**Given** the toggle and delete mutations in `useTodos`
**When** I inspect the `onMutate` / `onError` / `onSettled` handlers
**Then** optimistic updates are applied for toggle and delete (cache updated immediately, rolled back on error); create does NOT use optimistic updates

**Given** the mutation retry configuration
**When** I inspect the TanStack Query mutation options
**Then** mutations are configured with `retry: 1` and queries with `retry: false`

**Given** `frontend/src/main.tsx`
**When** I inspect it
**Then** `QueryClientProvider` wraps the entire React tree

---

### Story 2.3: TodoList Component (List, Loading, Empty & Error States)

As a user,
I want to see my todo items in a list that immediately communicates whether it is loading, empty, errored, or populated,
So that I always know the state of my data and can take action accordingly.

**Acceptance Criteria:**

**Given** the app loads and the API call is in-flight
**When** I view `TodoList`
**Then** a loading indicator is displayed (TanStack Query `isLoading` — shown only on first load with no cached data)

**Given** the API returns an empty array
**When** I view `TodoList`
**Then** a meaningful empty state message is displayed (e.g., "No todos yet — add one above") with no list rendered

**Given** the API returns one or more todos
**When** I view `TodoList`
**Then** all todos are rendered as a list, ordered with most recently created first

**Given** the API call fails (network or server error)
**When** I view `TodoList`
**Then** an error message is displayed and a retry button is visible — the page does not crash or go blank

**Given** I click the retry button after an error
**When** TanStack Query re-executes the query
**Then** the list attempts to reload without a full page refresh

**Given** a single mutation (toggle or delete) fails
**When** the optimistic update is rolled back
**Then** the rest of the todo list remains unchanged and visible — no items are lost

---

### Story 2.4: TodoItem Component (Display, Toggle, Delete & Visual State)

As a user,
I want each todo item to show its full text, let me toggle completion and delete it, and clearly signal its status without relying on colour alone,
So that I can manage individual tasks efficiently and the interface is accessible to all users.

**Acceptance Criteria:**

**Given** a todo item is rendered
**When** I view it
**Then** its full text is visible and a checkbox (or equivalent toggle control) and a delete button are present

**Given** an active todo item
**When** I click the toggle control
**Then** the item immediately appears completed (optimistic update) — strikethrough applied to text AND a non-colour indicator (icon or "Completed" label) is shown alongside any colour change

**Given** a completed todo item
**When** I click the toggle control again
**Then** the item immediately reverts to active state (optimistic update) — strikethrough and completed indicator are removed

**Given** a todo item is displayed
**When** I activate the delete button (click or keyboard)
**Then** the item is immediately removed from the list (optimistic update)

**Given** a toggle or delete mutation fails on the server
**When** the error is returned
**Then** the item reverts to its previous state (rollback) and an error is surfaced to the user

**Given** a completed todo item
**When** I inspect the DOM
**Then** completion status is conveyed through at least two distinct visual signals (e.g., strikethrough text AND an icon/label) — not colour alone

---

### Story 2.5: AddTodoForm Component (Create Todo)

As a user,
I want to type a todo description and submit it to add it to my list,
So that I can capture tasks quickly without leaving the keyboard.

**Acceptance Criteria:**

**Given** the AddTodoForm is rendered
**When** I view it
**Then** a text input and a submit button are visible

**Given** I type a description in the input
**When** I press Enter or click the submit button
**Then** a `POST /api/v1/todos` request is sent and the new todo appears at the top of the list once the server responds

**Given** I submit the form successfully
**When** the todo is added
**Then** the input field is cleared and focus returns to it, ready for the next entry

**Given** the input field is empty
**When** I attempt to submit
**Then** submission is prevented (HTML `required` attribute) — no API call is made

**Given** I am using a keyboard only
**When** I Tab to the input, type a description, and press Enter
**Then** the todo is created without requiring a mouse click

**Given** the create mutation is in-flight
**When** I inspect the submit button
**Then** it is disabled or visually indicates a pending state to prevent duplicate submissions

---

### Story 2.6: App Composition, Responsive Layout & Accessibility

As a user,
I want the application to work on any screen size and be fully operable by keyboard,
So that I can use it on mobile and desktop and accessibility requirements are met.

**Acceptance Criteria:**

**Given** `frontend/src/App.tsx`
**When** I inspect it
**Then** it composes `AddTodoForm` and `TodoList` with a React `ErrorBoundary` at the root, and `QueryClientProvider` wraps the tree in `main.tsx`

**Given** a mobile viewport (≤ 640px)
**When** I view the application
**Then** all UI elements are usable — no horizontal scroll, no overlapping elements, touch targets are adequately sized

**Given** a desktop viewport (≥ 1024px)
**When** I view the application
**Then** the layout is readable and well-spaced, making efficient use of the available width

**Given** the application is loaded
**When** I run an automated accessibility audit (Lighthouse or axe-core)
**Then** zero critical WCAG 2.1 AA violations are reported

**Given** I am using a keyboard only
**When** I Tab through all interactive elements
**Then** every control (input, submit, toggle, delete) is reachable and operable in a logical order with visible focus indicators

**Given** an unexpected render error occurs inside a component
**When** it propagates to the root `ErrorBoundary`
**Then** a fallback UI is shown — the page does not render a blank screen or uncaught error

---

### Story 2.7: Frontend Unit Tests (Vitest)

As a developer,
I want unit tests for all frontend components and the `useTodos` hook,
So that the 70% meaningful code coverage target is met for the frontend and regressions are caught early.

**Acceptance Criteria:**

**Given** `frontend/src/components/TodoList.test.tsx`, `TodoItem.test.tsx`, `AddTodoForm.test.tsx`, and `frontend/src/hooks/useTodos.test.ts`
**When** I run `npm run test` in `frontend/`
**Then** all tests pass

**Given** the test suite
**When** I inspect the tests
**Then** they cover: loading state rendering, empty state rendering, error state rendering, todo list rendering, toggle interaction, delete interaction, form submission, and empty form prevention

**Given** the tests use TanStack Query
**When** I inspect the test setup
**Then** components are wrapped in a `QueryClientProvider` test wrapper — no mocking of the hook itself

**Given** I run the coverage report
**When** I inspect the output
**Then** meaningful frontend code coverage is ≥ 70%

---

### Story 2.8: Backend Integration Tests (Vitest)

As a developer,
I want integration tests for all backend API endpoints running against a real test database,
So that the 70% coverage target is met for the backend and API contracts are verified end-to-end.

**Acceptance Criteria:**

**Given** `backend/src/routes/todos.test.ts`, `backend/src/routes/health.test.ts`, and `backend/src/middleware/errorHandler.test.ts`
**When** I run `npm run test` in `backend/`
**Then** all tests pass

**Given** the integration tests
**When** they run
**Then** they use the real Prisma client connected to `DATABASE_URL_TEST` — no mocking of the database layer

**Given** the tests
**When** I inspect them
**Then** they cover: `GET /api/v1/todos` (empty + populated), `POST /api/v1/todos` (success + validation error), `PATCH /api/v1/todos/:id` (success + not found), `DELETE /api/v1/todos/:id` (success + not found), `GET /api/health`

**Given** `backend/vitest.config.ts`
**When** I inspect it
**Then** it is a standalone Vitest config (not shared with the frontend Vite config) with the test environment and database setup configured

**Given** `DATABASE_URL_TEST` is set and `npm run test` is invoked in `backend/`
**When** the test suite initialises
**Then** Prisma migrations have been applied to the test database before any test executes (via `prisma migrate deploy` or equivalent in the Vitest global setup)

**Given** I run the coverage report
**When** I inspect the output
**Then** meaningful backend code coverage is ≥ 70%

---

## Epic 3: Production Deployment & E2E Quality

The application is fully containerised with multi-stage Docker builds, deployable via a single `docker-compose up`, and verified end-to-end by a Playwright test suite covering all user journeys.

**FRs covered:** FR17 (complete)

### Story 3.1: Multi-Stage Dockerfiles (Frontend & Backend)

As a developer,
I want production-ready multi-stage Dockerfiles for both the frontend and backend,
So that each service runs as a minimal, non-root container with a health check, ready for production deployment.

**Acceptance Criteria:**

**Given** `frontend/Dockerfile`
**When** I inspect it
**Then** it uses a two-stage build: `node:22-alpine` build stage (installs deps, runs `vite build`) and `nginx:alpine` production stage (copies `/dist`, serves on port 80)

**Given** `backend/Dockerfile`
**When** I inspect it
**Then** it uses a two-stage build: `node:22-alpine` build stage (installs deps, compiles TypeScript) and `node:22-alpine` production stage (copies compiled output, runs as non-root user `node`)

**Given** both Dockerfiles
**When** I inspect them
**Then** neither uses `node:latest` or any unversioned base image tag

**Given** both production container stages
**When** I inspect the `USER` directive
**Then** both run as the non-root `node` user — never as `root`

**Given** both Dockerfiles
**When** I inspect them
**Then** each contains a `HEALTHCHECK` directive appropriate to the service (HTTP check for backend, TCP/HTTP for frontend nginx)

**Given** `frontend/nginx.conf`
**When** I inspect it
**Then** it serves `/dist` as static files and proxies all `/api/*` requests to `http://backend:3001`

---

### Story 3.2: Production docker-compose.yml

As a developer,
I want a finalised `docker-compose.yml` orchestrating all three services (db, backend, frontend) with correct startup ordering, networking, and volume configuration,
So that `docker-compose up --build` starts the complete application stack with no manual steps beyond providing a `.env` file.

**Acceptance Criteria:**

**Given** `docker-compose.yml`
**When** I run `docker-compose up --build`
**Then** all three services (db, backend, frontend) start successfully and the application is accessible at `http://localhost:80`

**Given** the `db` service definition
**When** I inspect it
**Then** it uses `postgres:17`, has a named volume for data persistence, and has a `healthcheck` configured (e.g., `pg_isready`)

**Given** the `backend` service definition
**When** I inspect it
**Then** it `depends_on` db with `condition: service_healthy`, and all required env vars (`DATABASE_URL`, `PORT`, `CORS_ORIGIN`, `NODE_ENV`) are supplied via the `.env` file

**Given** the `frontend` service definition
**When** I inspect it
**Then** it `depends_on` backend with `condition: service_healthy` and exposes port 80

**Given** the running stack
**When** I send `GET http://localhost/api/health`
**Then** I receive `200 OK` — confirming nginx proxies `/api/*` through to the backend correctly

**Given** `docker-compose up --build` completes
**When** I stop and restart with `docker-compose up` (no `--build`)
**Then** previously created todo items are still present — data persisted via the named volume

---

### Story 3.3: Playwright E2E Test Suite

As a developer,
I want a Playwright E2E test suite with at least 5 passing specs covering all core user journeys,
So that the complete application stack is verified end-to-end and regressions in user-facing behaviour are caught automatically.

**Acceptance Criteria:**

**Given** the full Docker stack is running (`docker-compose up --build -d`)
**When** I run `npx playwright test --config e2e/playwright.config.ts`
**Then** all 5 spec files pass with zero failures

**Given** `e2e/create-todo.spec.ts`
**When** the test runs
**Then** it verifies: typing a description and submitting adds the new todo to the top of the list (covers FR1, FR9)

**Given** `e2e/complete-todo.spec.ts`
**When** the test runs
**Then** it verifies: clicking the toggle on an active todo marks it completed with visible strikethrough/completed indicator; clicking again reverts it (covers FR2, FR3, FR7, FR21)

**Given** `e2e/delete-todo.spec.ts`
**When** the test runs
**Then** it verifies: clicking delete removes the todo from the list and it does not reappear on page reload (covers FR4, FR14)

**Given** `e2e/empty-state.spec.ts`
**When** the test runs
**Then** it verifies: loading the app with no todos shows the empty state message, not a blank or errored view (covers FR9)

**Given** `e2e/error-handling.spec.ts`
**When** the test runs
**Then** it verifies: when the API is unavailable, an error state (not a crash) is shown with a retry button; when the API becomes available and retry is clicked, the list loads (covers FR11, FR12, FR13)

**Given** `e2e/playwright.config.ts`
**When** I inspect it
**Then** `baseURL` is read from an environment variable (not hardcoded) and the config is set to run against the full assembled application
