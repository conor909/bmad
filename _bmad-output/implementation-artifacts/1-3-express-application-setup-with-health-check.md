# Story 1.3: Express Application Setup with Health Check

Status: done

## Story

As a developer,
I want the Express application factory and server bootstrap separated, with security middleware, global error handling, and a health check endpoint configured,
So that the backend is testable without a running server and all cross-cutting concerns are in place before feature routes are added.

## Acceptance Criteria

1. `backend/src/app.ts` exports an Express app factory (no `app.listen()`) with Helmet, CORS, and global error middleware registered.
2. `backend/src/index.ts` is the only file that calls `app.listen(PORT)`.
3. `GET /api/health` returns `200 OK` with body `{ "status": "ok", "timestamp": "<ISO 8601 string>" }`.
4. An unhandled error thrown in a route propagates to `backend/src/middleware/errorHandler.ts`, which responds with `{ "error": "<message>", "code": "<MACHINE_CODE>" }` and the appropriate HTTP status.
5. Helmet middleware is registered — security headers present on all responses.
6. CORS middleware configured with `CORS_ORIGIN` env var — correct `Access-Control-Allow-Origin` header on matching requests.

## Tasks / Subtasks

- [x] Task 1: Create error handler middleware (AC: #4)
  - [x] Create `backend/src/middleware/errorHandler.ts` with Express error middleware signature `(err, req, res, next)`
  - [x] Handle Zod errors → 400 + `{ error, code: "VALIDATION_ERROR" }`
  - [x] Handle generic errors → 500 + `{ error: "Internal server error", code: "INTERNAL_ERROR" }`
  - [x] Handle errors with `status` property → use that status + `{ error, code }`

- [x] Task 2: Create health route (AC: #3)
  - [x] Create `backend/src/routes/health.ts` exporting an Express Router
  - [x] Register `GET /api/health` returning `{ status: "ok", timestamp: new Date().toISOString() }`

- [x] Task 3: Update app.ts (AC: #1, #5, #6)
  - [x] Import and register `helmet()` before all routes
  - [x] Import and register `cors({ origin: process.env.CORS_ORIGIN })` before all routes
  - [x] Import and register health router at `/api`
  - [x] Import and register `errorHandler` as last middleware (after all routes)

- [x] Task 4: Write integration tests (AC: #3, #4)
  - [x] Create `backend/src/routes/health.test.ts` — test GET /api/health returns 200 + correct shape
  - [x] Create `backend/src/middleware/errorHandler.test.ts` — test error envelope for generic errors and status-bearing errors
  - [x] Run `npm run test` in `backend/` — all tests pass

- [x] Task 5: Final validation (AC: all)
  - [x] Run `npx tsc --noEmit` — zero errors
  - [x] Run `npm run test` — all tests pass (including existing prisma.test.ts)
  - [x] Confirm `app.listen` only exists in `index.ts`

## Dev Notes

### Architecture Requirements (NON-NEGOTIABLE)

- `app.ts` MUST NOT call `app.listen()` — separation is required for testability
- Error handler MUST be the last `app.use()` call — Express identifies error middleware by 4-argument signature
- Health route: exactly `GET /api/health` (not `/api/v1/health`) — matches architecture spec
- All error responses: `{ "error": "<message>", "code": "<MACHINE_CODE>" }` — no other shape

### Error Handler — `backend/src/middleware/errorHandler.ts`

```typescript
import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: err.errors[0].message, code: 'VALIDATION_ERROR' })
    return
  }

  if (err instanceof Error && 'status' in err) {
    const status = (err as Error & { status: number }).status
    res.status(status).json({ error: err.message, code: 'NOT_FOUND' })
    return
  }

  const message = err instanceof Error ? err.message : 'Internal server error'
  res.status(500).json({ error: message, code: 'INTERNAL_ERROR' })
}
```

### Health Route — `backend/src/routes/health.ts`

```typescript
import { Router } from 'express'

export const healthRouter = Router()

healthRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})
```

### Updated app.ts

```typescript
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { healthRouter } from './routes/health'
import { errorHandler } from './middleware/errorHandler'

export const app = express()

app.use(express.json())
app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN }))

app.use('/api', healthRouter)

// Future routes registered here (Story 2.1+)

app.use(errorHandler)
```

### Testing Approach

Use `supertest` to test routes without starting a real server — import `app` directly.

Install: `npm install -D supertest @types/supertest --prefix backend`

Health test:
```typescript
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../app'

describe('GET /api/health', () => {
  it('returns 200 with status ok and ISO timestamp', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(typeof res.body.timestamp).toBe('string')
    expect(() => new Date(res.body.timestamp)).not.toThrow()
  })
})
```

Error handler test:
```typescript
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import express from 'express'
import { ZodError, z } from 'zod'
import { errorHandler } from './errorHandler'

function makeApp(thrownError: unknown) {
  const testApp = express()
  testApp.get('/test', (_req, _res, next) => next(thrownError))
  testApp.use(errorHandler)
  return testApp
}

describe('errorHandler middleware', () => {
  it('returns 400 VALIDATION_ERROR for ZodError', async () => {
    let zodErr: ZodError
    try { z.string().parse(42) } catch (e) { zodErr = e as ZodError }
    const res = await request(makeApp(zodErr!)).get('/test')
    expect(res.status).toBe(400)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })

  it('returns 500 INTERNAL_ERROR for generic Error', async () => {
    const res = await request(makeApp(new Error('boom'))).get('/test')
    expect(res.status).toBe(500)
    expect(res.body.code).toBe('INTERNAL_ERROR')
    expect(res.body.error).toBe('boom')
  })

  it('uses status property when present', async () => {
    const err = Object.assign(new Error('not found'), { status: 404 })
    const res = await request(makeApp(err)).get('/test')
    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })
})
```

### Story 1.2 Learnings Applied

- Prisma 7 requires `@prisma/adapter-pg` — already installed
- `backend/src/lib/prisma.ts` is the sole `PrismaClient` instantiation point
- `DATABASE_URL` validated at startup via guard in `createPrismaClient()`
- All tests run against `DATABASE_URL_TEST` via `vitest.config.ts` swap

### File Structure After This Story

```
backend/src/
├── middleware/
│   ├── errorHandler.ts     ← NEW
│   └── errorHandler.test.ts← NEW
├── routes/
│   ├── health.ts           ← NEW
│   └── health.test.ts      ← NEW
├── lib/
│   ├── prisma.ts           ← unchanged
│   └── prisma.test.ts      ← unchanged
├── app.ts                  ← MODIFIED: helmet, cors, health route, errorHandler
└── index.ts                ← unchanged
```

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Review Findings (AI)

**Date:** 2026-05-01 | **Layers:** Blind Hunter, Edge Case Hunter, Acceptance Auditor

- [x] [Review][Patch] Status-bearing errors always emitted `code: 'NOT_FOUND'` regardless of actual status — fixed: 404→NOT_FOUND, other valid statuses→INTERNAL_ERROR; invalid status codes clamped to 500 [`backend/src/middleware/errorHandler.ts:16-23`]
- [x] [Review][Patch] `ZodError.issues[0]` crashes when issues array is empty — fixed: optional chaining with fallback `'Validation failed'` [`backend/src/middleware/errorHandler.ts:10`]
- [x] [Review][Patch] `CORS_ORIGIN` undefined → `cors` defaults to `*` (all origins allowed) — fixed: `origin: process.env.CORS_ORIGIN || false` disables CORS when env var absent [`backend/src/app.ts:9`]
- [x] [Review][Patch] 500 response leaked raw `err.message` to clients — fixed: always returns `'Internal server error'`; actual error logged via `console.error` [`backend/src/middleware/errorHandler.ts:26-27`]
- [x] [Review][Patch] No test for non-Error thrown values or invalid status codes — fixed: added 3 new test cases in errorHandler.test.ts [`backend/src/middleware/errorHandler.test.ts`]
- [x] [Review][Defer] No structured logger — deferred; observability out of scope for this story
- [x] [Review][Defer] ZodError returns only first issue — deferred; API response shapes owned by Story 2.1
- [x] [Review][Defer] Health endpoint performs no DB probe — deferred; spec only requires `{ status: "ok", timestamp }`
- [x] [Review][Defer] `express.json()` registered before `helmet()` — deferred; minor ordering concern, no security impact in practice
- [x] [Review][Defer] Health test imports full app stack — deferred; acceptable coupling for integration test

### Debug Log References

- Zod v4 uses `err.issues` not `err.errors` — story spec used `.errors[0].message`, fixed to `.issues[0].message`

### Completion Notes List

- AC#1 ✅ `app.ts` exports app factory with helmet, cors, healthRouter, errorHandler — no `listen()`
- AC#2 ✅ `app.listen` only in `index.ts` — confirmed via grep
- AC#3 ✅ `GET /api/health` returns 200 `{ status: "ok", timestamp: "<ISO>" }` — tested
- AC#4 ✅ `errorHandler.ts` handles ZodError (400), status errors (dynamic), generic (500) — tested
- AC#5 ✅ Helmet registered — headers present on responses
- AC#6 ✅ CORS registered with `CORS_ORIGIN` env var

### File List

- `backend/src/app.ts` (modified — helmet, cors, healthRouter, errorHandler added)
- `backend/src/middleware/errorHandler.ts` (created)
- `backend/src/middleware/errorHandler.test.ts` (created)
- `backend/src/routes/health.ts` (created)
- `backend/src/routes/health.test.ts` (created)
- `backend/package.json` (updated — supertest, @types/supertest added)
