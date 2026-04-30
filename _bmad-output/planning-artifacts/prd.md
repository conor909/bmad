---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
releaseMode: single-release
inputDocuments: ['inline-product-brief']
classification:
  projectType: web_app
  domain: general_productivity
  complexity: low
  projectContext: greenfield
workflowType: 'prd'
---

# Product Requirements Document - bmad

**Author:** Conor
**Date:** 2026-04-30

## Executive Summary

A full-stack Todo application built as a proof-of-concept to exercise the BMAD Method end-to-end. The application targets a single user managing personal tasks and delivers four core actions: create, view, complete, and delete todo items. Each todo carries a text description, completion status, and creation timestamp. The interface loads immediately with no onboarding, reflects all actions instantly, and works across desktop and mobile. The backend exposes a minimal CRUD API with durable persistence. Authentication and multi-user support are intentionally excluded from v1 but the architecture must not foreclose them.

The value of this project is in the process used to build it, not the product itself. Deliberate minimalism is the design principle — every excluded feature is a conscious decision to keep the core experience clean and the BMAD learning process visible.

## Project Classification

- **Project Type:** Full-Stack Web Application (SPA + REST API)
- **Domain:** General Productivity / Task Management
- **Complexity:** Low
- **Project Context:** Greenfield

## Success Criteria

### User Success

A first-time user can create, complete, and delete a todo item within 2 minutes with zero documentation or onboarding. All core actions are discoverable through the UI alone.

### Business Success

This is a BMAD Method proof-of-concept. Success is defined by the quality and completeness of the BMAD artifact chain: a reviewer picking up this repository should find a PRD, epics, and stories that are internally consistent, sufficiently detailed, and actionable enough to begin development without additional clarification.

### Technical Success

The application is stable across page refreshes and user sessions — no data loss, no broken state. Client-side and server-side error conditions are handled gracefully without disrupting the user flow.

### Measurable Outcomes

- First-time task completion (create → complete → delete) achievable in under 2 minutes, unassisted
- Zero data loss across browser refresh cycles
- Full BMAD artifact set present in repository and reviewable as a cohesive deliverable
- Application starts and runs correctly via `docker-compose up` with no manual setup
- Minimum 5 passing Playwright E2E tests covering all core user journeys
- Zero critical WCAG AA accessibility violations
- Minimum 70% meaningful code coverage across unit and integration tests

## Product Scope

### MVP — Minimum Viable Product

Single release. All capabilities ship together; no phases, no deferred features.

**Must-Have Capabilities:**
- Display todo list with loading state
- Create todo item (text description, auto-assigned creation timestamp)
- Toggle todo completion status (mark complete / unmark)
- Delete todo item
- Visual distinction between active and completed todos
- Empty, loading, and error states
- Responsive layout (mobile + desktop)
- REST API with full CRUD operations
- Durable data persistence
- Backend health check endpoint
- Docker containerisation (frontend + backend + database)
- Environment-based configuration (dev/test via environment variables)

**Resource Requirements:** Single developer with full-stack skills. Estimated delivery: 1–2 days for an experienced developer.

### Vision (Future — Non-Goals for v1)

Multi-user support, authentication, task prioritization, deadlines, and notifications are explicitly out of scope. Architecture must not prevent these from being added later.

### Risk Mitigation

**Technical:** None significant. Keep the stack conventional — no experimental libraries or patterns.
**Resource:** Over-engineering is the primary risk. Scope is frozen; any expansion requires a deliberate decision.

## User Journeys

### Journey 1: Primary User — Core Task Management (Happy Path)

**Meet Alex.** Alex uses the app daily to track what they need to get done. They open the app on their laptop — their list loads immediately. Three tasks stare back at them. They knock out the first one and click complete — it dims and moves visually to signal it's done. They add a new task, type a description, hit enter, and it appears at the top of the list. One old completed task is just noise now — they delete it. Total time: under a minute. Alex closes the tab.

**Emotional arc:** Efficient → satisfied. The app got out of the way.

**Capabilities revealed:** Todo list display, create todo, complete todo, delete todo, visual status distinction, instant UI feedback.

---

### Journey 2: Primary User — First Visit / Empty State

**Meet Sam.** Sam opens the app for the first time. The page loads fast. There are no todos yet — the app shows a clear empty state that communicates "add your first task" without being patronising. Sam types a task description and submits. It appears immediately. Sam adds two more. A working list with zero explanation needed.

**Emotional arc:** Curious → confident. No friction, no confusion.

**Capabilities revealed:** Empty state UI, todo creation flow, list population from zero, instant feedback on first action.

---

### Journey 3: Primary User — Error Recovery

**Meet Jordan.** Jordan tries to complete a todo but their connection drops mid-action. The UI responds gracefully — an error state appears without crashing the page or losing their other data. Jordan's existing list is still visible. When their connection restores, they try again and it works. No data was lost.

**Emotional arc:** Frustrated → relieved. Trust maintained.

**Capabilities revealed:** Client-side error handling, server-side error responses, UI resilience under failure, no data loss on transient errors.

---

### Journey Requirements Summary

| Capability | Revealed By |
|---|---|
| Display todo list | Journey 1, 2 |
| Create todo | Journey 1, 2 |
| Complete todo | Journey 1 |
| Delete todo | Journey 1 |
| Visual status distinction (active vs completed) | Journey 1 |
| Empty state handling | Journey 2 |
| Loading state handling | Journey 1, 2 |
| Error state handling (client + server) | Journey 3 |
| Instant UI feedback on all actions | Journey 1, 2 |
| Data durability across sessions | Journey 3 |

## Web Application Specific Requirements

### Architecture

Single-page application (SPA) with a REST API backend. No server-side rendering, no SEO requirements, no real-time sync. The client fetches data on load and reflects user actions immediately through direct API calls.

- **Rendering:** Client-side SPA — full page load once, all subsequent interactions handled in-browser
- **State:** Local UI state managed client-side; source of truth is the API/database
- **Data flow:** Frontend ↔ REST API ↔ Database

### Browser Support

Modern evergreen browsers (Chrome, Firefox, Safari, Edge — current versions). No legacy browser support required.

### Responsive Design

Mobile and desktop layouts required. No native app, no PWA. Standard responsive CSS breakpoints sufficient.

### Implementation Constraints

- No websockets, service workers, offline mode, or native device features
- No authentication middleware in v1; routing and API structure must support auth addition without rework

## Functional Requirements

### Todo Management

- **FR1:** User can create a todo item with a text description
- **FR2:** User can mark a todo item as complete
- **FR3:** User can unmark a completed todo item (toggle back to active)
- **FR4:** User can delete a todo item
- **FR5:** System automatically assigns a creation timestamp to each todo item at the time of creation

### Todo Display & List

- **FR6:** User can view all todo items in a single list
- **FR7:** User can visually distinguish active todo items from completed todo items
- **FR8:** User can read the full text description of each todo item in the list

### Application States

- **FR9:** User sees a meaningful empty state when no todo items exist
- **FR10:** User sees a loading state while todo data is being fetched from the server
- **FR11:** User sees an error state when a server or network operation fails
- **FR12:** User can retry a failed operation without reloading the page
- **FR13:** Existing todo items remain visible and usable when a single operation fails

### Data Persistence & API

- **FR14:** System persists todo items durably across browser sessions and page refreshes
- **FR15:** System exposes a REST API supporting create, read, update, and delete operations on todo items

### Infrastructure & Deployment

- **FR16:** Backend exposes a health check endpoint that returns current service status
- **FR17:** Application runs in its entirety via `docker-compose up` with no manual steps beyond environment variable configuration
- **FR18:** Application behaviour is configurable per environment (dev/test) via environment variables without code changes

### Layout & Accessibility

- **FR19:** User can access all application features on both mobile and desktop screen sizes
- **FR20:** User can navigate and operate the application using a keyboard alone
- **FR21:** User can distinguish todo item completion status through visual contrast that does not rely on colour alone

## Non-Functional Requirements

### Performance

- All CRUD API operations complete in under 500ms under normal network conditions
- Initial page load delivers a usable interface in under 2 seconds on a standard broadband connection
- UI reflects user actions (create, complete, delete) without perceptible delay — no loading spinner required for individual actions

### Security

- All client-server communication transmitted over HTTPS in production; HTTPS is handled by deployment infrastructure (load balancer / reverse proxy) and is out of scope for this v1 PoC running via docker-compose locally
- No sensitive user data stored beyond todo content; no auth tokens, passwords, or PII in v1
- API structure must support per-user data isolation when authentication is added (no shared global state)
- All user-supplied input sanitised server-side; application must not be vulnerable to XSS or injection attacks

### Reliability

- Application recovers from transient server errors without a full page reload
- Failed operations do not corrupt or discard previously loaded todo data
- On server error, the UI surfaces a recoverable error state, not a crash or blank screen

### Accessibility

- Application meets WCAG 2.1 AA compliance — zero critical violations as measured by automated audit (Lighthouse or axe-core)
- Application is operable via keyboard without a mouse
- Completion status communicated through visual means that do not rely on colour alone (e.g., strikethrough, icon, or label alongside colour change)

## Testing Requirements

### Unit & Integration Tests

- Unit tests cover frontend components and backend business logic using Jest or Vitest
- Integration tests cover each API endpoint (create, read, update, delete, health check)
- Minimum 70% meaningful code coverage across unit and integration tests combined

### End-to-End Tests

- E2E test suite implemented with Playwright
- Minimum 5 passing tests covering: create todo, complete todo, delete todo, empty state, error handling
- Tests run against the fully assembled application (not mocks)

## Deployment Requirements

### Containerisation

- Separate Dockerfiles for frontend and backend using multi-stage builds
- Containers run as non-root users
- Each container exposes a health check
- `docker-compose.yml` orchestrates all services (frontend, backend, database if applicable) with correct networking and volume configuration

### Environment Configuration

- All environment-specific values (ports, database URLs, API URLs) supplied via environment variables
- `docker-compose.yml` supports dev and test environments via profiles or separate compose files
- No hardcoded environment values in application code
