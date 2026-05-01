# Story 1.2: Todo Data Model & Initial Database Migration

Status: done

## Story

As a developer,
I want the Prisma Todo schema defined and the initial migration applied to the database,
so that the persistence layer is ready for CRUD operations and structured to support auth without restructuring.

## Acceptance Criteria

1. `backend/prisma/schema.prisma` defines the Todo model with exactly these fields: `id String @id @default(cuid())`, `text String`, `completed Boolean @default(false)`, `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`, `userId String?` (nullable).
2. Running `npx prisma migrate dev --name init` in `backend/` creates a versioned migration file under `backend/prisma/migrations/` and the `Todo` table exists in the database with all expected columns.
3. `backend/src/lib/prisma.ts` exports a single Prisma client singleton — it is the only file in the backend that instantiates `PrismaClient`.
4. After migration, querying the database directly confirms the `Todo` table is present and matches the schema (no extra columns, no missing columns).

## Tasks / Subtasks

- [x] Task 1: Define Todo model in `backend/prisma/schema.prisma` (AC: #1)
  - [x] Open `backend/prisma/schema.prisma` — the generator and datasource blocks are already present (from Story 1.1)
  - [x] Add the Todo model block exactly as specified in Dev Notes — no extra fields, no changes to existing blocks
  - [x] Verify the model compiles: run `npx prisma validate` in `backend/` — must exit 0

- [x] Task 2: Create Prisma client singleton (AC: #3)
  - [x] Create directory `backend/src/lib/`
  - [x] Create `backend/src/lib/prisma.ts` with the singleton pattern (see Dev Notes for exact content)
  - [x] Verify TypeScript compiles: run `npx tsc --noEmit` in `backend/` — must exit 0

- [x] Task 3: Generate Prisma client (prerequisite for AC: #2, #4)
  - [x] Ensure `backend/.env` has `DATABASE_URL` pointing to a running PostgreSQL 17 instance (see Dev Notes for Docker setup)
  - [x] Run `npx prisma generate` in `backend/` — generates client to `backend/src/generated/prisma/`
  - [x] Verify `backend/src/generated/prisma/` directory exists with generated files

- [x] Task 4: Run initial migration (AC: #2, #4)
  - [x] Run `npx prisma migrate dev --name init` in `backend/` with a running PostgreSQL instance
  - [x] Verify `backend/prisma/migrations/` contains a new timestamped directory with `migration.sql`
  - [x] Verify the migration SQL contains `CREATE TABLE "Todo"` with all expected columns

- [x] Task 5: Write smoke test for Prisma singleton (validates AC: #3, #4)
  - [x] Create `backend/src/lib/prisma.test.ts` — a minimal test that imports the singleton, creates a Todo, queries it, then deletes it (full cleanup)
  - [x] Run `npm run test` in `backend/` — test must pass against the test database (`DATABASE_URL_TEST`)

- [x] Task 6: Final validation (AC: all)
  - [x] Re-run `npx prisma validate` — schema valid
  - [x] Confirm `backend/prisma/migrations/` has exactly one migration directory
  - [x] Confirm `backend/src/lib/prisma.ts` exists and `PrismaClient` is not instantiated anywhere else in `backend/src/`
  - [x] Run `npm run test` in `backend/` — all tests pass

### Review Findings (AI)

**Date:** 2026-05-01 | **Layers:** Blind Hunter, Edge Case Hunter, Acceptance Auditor

- [x] [Review][Decision→Defer] Import path `'../generated/prisma/client'` deviates from spec's `'../generated/prisma'` — Prisma 7 generated client has no `index.ts`; spec was written for Prisma 5/6 — update story template [`backend/src/lib/prisma.ts:1`]
- [x] [Review][Decision→Defer] PrismaClient initialized with `PrismaPg` driver adapter instead of spec's bare `new PrismaClient()` — Prisma 7 requires driver adapter; spec's pattern is invalid in v7 — update spec template [`backend/src/lib/prisma.ts:8-11`, `backend/package.json`]
- [x] [Review][Decision→Defer] `vitest.config.ts` DATABASE_URL swap block not in spec's prescribed implementation — spec example is incomplete; it describes what to load but not how to route to test DB — clarify in future stories [`backend/vitest.config.ts:5-7`]
- [x] [Review][Patch] `pg` dependency duplicated in `backend/package.json` — false positive; actual file had only one entry (diff construction artifact) [`backend/package.json`]
- [x] [Review][Patch] `@prisma/adapter-pg` pinned to `^7.8.0` (minor-allows) while `prisma` CLI and `@prisma/client` are `~7.6.0` (patch-only) — fixed: changed to `~7.6.0`; all three now locked at patch-range [`backend/package.json`]
- [x] [Review][Patch] `DATABASE_URL` not validated before `PrismaPg` construction — fixed: throws `Error('DATABASE_URL environment variable is not set')` before adapter creation [`backend/src/lib/prisma.ts:9`]
- [x] [Review][Patch] Smoke test has no cleanup guarantee on failure — fixed: wrapped assertions in `try/finally`; delete now runs even if assertions throw [`backend/src/lib/prisma.test.ts:9-27`]
- [x] [Review][Patch] `updatedAt` field not asserted in smoke test — fixed: added `expect(created.updatedAt).toBeInstanceOf(Date)` [`backend/src/lib/prisma.test.ts`]
- [x] [Review][Defer] Stale/disconnected global client reused on hot-reload — known tradeoff of `globalThis` singleton pattern; pre-existing concern [`backend/src/lib/prisma.ts:13`] — deferred, pre-existing
- [x] [Review][Defer] `userId` has no FK constraint or index — spec intentionally defers auth enforcement to a later story [`backend/prisma/schema.prisma`] — deferred, pre-existing by design
- [x] [Review][Defer] No down/rollback migration — Prisma doesn't generate them by default; pre-existing limitation [`backend/prisma/migrations/`] — deferred, pre-existing
- [x] [Review][Defer] `dotenv/config` in `index.ts` uses default `.env` path — fragile outside `backend/` dir, but spec-prescribed pattern; pre-existing [`backend/src/index.ts`] — deferred, pre-existing
- [x] [Review][Defer] No `text` length constraint on `Todo.text` — out of scope for this story; future validation concern [`backend/prisma/schema.prisma`] — deferred, pre-existing

## Dev Notes

### Prerequisites — Running PostgreSQL

Story 1.2 requires a live PostgreSQL 17 instance. Use the Docker Compose approach from the project:

```bash
# From project root — starts database only
docker-compose up db -d
```

If `docker-compose.yml` does not yet have a `db` service, run a one-off container:

```bash
docker run -d \
  --name todo-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=todos \
  -p 5432:5432 \
  postgres:17
```

Then set `backend/.env`:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/todos
DATABASE_URL_TEST=postgresql://postgres:password@localhost:5432/todos_test
```

The `prisma.config.ts` (already present from Story 1.1) loads `backend/.env` automatically via `import "dotenv/config"`. Do not modify `prisma.config.ts`.

### Todo Model — Exact Schema (NON-NEGOTIABLE)

Add this block to `backend/prisma/schema.prisma` after the existing datasource block:

```prisma
model Todo {
  id        String   @id @default(cuid())
  text      String
  completed Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  userId    String?
}
```

**Field constraints:**
- `id`: cuid (not uuid) — shorter, URL-safe, lexicographically sortable
- `userId`: nullable (`String?`) — unenforced in v1 but required for auth-readiness (NFR6)
- `updatedAt @updatedAt`: Prisma auto-updates this on every write — do NOT set it manually
- No `@@map` or `@map` directives — Prisma handles camelCase→snake_case column mapping automatically

**Do NOT:**
- Add extra fields not listed above
- Change `@default(cuid())` to `uuid()` or `autoincrement()`
- Make `userId` non-nullable
- Add a `@relation` (no User model in v1)

### Prisma 7.6 — Generator and Import Path

The generator block in `schema.prisma` (already set by Story 1.1) uses Prisma 7's new provider:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}
```

This means:
- `prisma generate` emits the client to `backend/src/generated/prisma/`
- The generated directory is at `backend/src/generated/`
- **Import path from `backend/src/lib/prisma.ts`**: `'../generated/prisma'`

### Prisma Client Singleton — `backend/src/lib/prisma.ts`

```typescript
import { PrismaClient } from '../generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

**Why the singleton pattern:**
- Vitest re-imports modules per test file — without the global cache, each test file opens a new connection pool, exhausting PostgreSQL's connection limit
- The `globalThis` cache ensures only one `PrismaClient` instance exists per Node.js process
- In production (`NODE_ENV=production`), the global assignment is skipped (server process is long-lived, only one instance ever created)

**Rules for this file:**
- This is the ONLY file in `backend/src/` that instantiates `PrismaClient` — enforce this strictly
- All route handlers and lib files import `{ prisma }` from `'../lib/prisma'` (or `'./lib/prisma'` from routes)
- Never `new PrismaClient()` outside this file

### Smoke Test — `backend/src/lib/prisma.test.ts`

This test verifies the singleton connects, can create/read/delete a Todo, and cleans up:

```typescript
import { describe, it, expect, afterAll } from 'vitest'
import { prisma } from './prisma'

describe('Prisma singleton', () => {
  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('creates, reads, and deletes a Todo', async () => {
    const created = await prisma.todo.create({
      data: { text: 'smoke test todo' },
    })

    expect(created.id).toBeTruthy()
    expect(created.text).toBe('smoke test todo')
    expect(created.completed).toBe(false)
    expect(created.userId).toBeNull()
    expect(created.createdAt).toBeInstanceOf(Date)

    const fetched = await prisma.todo.findUniqueOrThrow({
      where: { id: created.id },
    })
    expect(fetched.id).toBe(created.id)

    await prisma.todo.delete({ where: { id: created.id } })

    const gone = await prisma.todo.findUnique({ where: { id: created.id } })
    expect(gone).toBeNull()
  })
})
```

**Test database setup:**
- Tests must run against `DATABASE_URL_TEST` (not the dev database) — set this in `backend/.env`
- The `vitest.config.ts` stub from Story 1.1 uses `environment: 'node'` and `globals: true` — no changes needed
- Add the following to `backend/vitest.config.ts` to load the test env var:

```typescript
import { defineConfig } from 'vitest/config'
import { config } from 'dotenv'

config({ path: '.env' })

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
})
```

- The test database (`todos_test`) must exist and have migrations applied: `DATABASE_URL=<test_url> npx prisma migrate deploy` or just point `DATABASE_URL_TEST` at the same database for local development if a separate test DB isn't yet configured

### Migration Command

Run from `backend/` directory (not project root):

```bash
cd backend
npx prisma migrate dev --name init
```

This command:
1. Connects to the database via `DATABASE_URL` (loaded by `prisma.config.ts`)
2. Generates a SQL migration in `backend/prisma/migrations/<timestamp>_init/migration.sql`
3. Applies the migration to the database
4. Runs `prisma generate` automatically — regenerates the client

**Do NOT use:**
- `prisma db push` — bypasses migration versioning, breaks production workflow
- `prisma migrate reset` — drops all data, never use in development without explicit intent

### Expected Migration SQL

After `prisma migrate dev --name init`, the generated `migration.sql` should contain:

```sql
CREATE TABLE "Todo" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    CONSTRAINT "Todo_pkey" PRIMARY KEY ("id")
);
```

If it doesn't match (e.g., wrong column names, missing nullable `userId`), the schema definition is wrong — fix the schema and re-run migration.

### `backend/src/generated/` in `.gitignore`

The generated Prisma client should NOT be committed. The `.gitignore` from Story 1.1 does not yet cover it. Add this line to the root `.gitignore` or `backend/.gitignore` (Prisma init already created `backend/.gitignore` — check if it covers `src/generated/prisma`):

Check `backend/.gitignore` — it should already contain `/src/generated/prisma` (added by Prisma 7 init). If it does, no action needed. If not, add it.

### File Structure After This Story

```
backend/
├── prisma/
│   ├── schema.prisma          ← MODIFIED: Todo model added
│   ├── prisma.config.ts       ← unchanged (from Story 1.1)
│   └── migrations/
│       └── <timestamp>_init/
│           └── migration.sql  ← NEW: generated by prisma migrate dev
└── src/
    ├── generated/
    │   └── prisma/            ← NEW: generated by prisma generate (gitignored)
    ├── lib/
    │   ├── prisma.ts          ← NEW: singleton
    │   └── prisma.test.ts     ← NEW: smoke test
    ├── app.ts                 ← unchanged
    └── index.ts               ← unchanged
```

### Story 1.1 Learnings Applied

- Prisma 7.6 uses `provider = "prisma-client"` (not `prisma-client-js`) — generator block already correct
- `prisma.config.ts` loads `DATABASE_URL` via `dotenv/config` — this is the correct Prisma 7 pattern, do not bypass it
- `dotenv/config` is imported in `index.ts` for runtime; `prisma.config.ts` handles CLI commands
- `@prisma/client ~7.6.0` is already in `backend/package.json` dependencies
- `prisma ~7.6.0` is already in `backend/package.json` devDependencies
- Code review enforced: `@prisma/client` MUST be in runtime dependencies (not just devDependencies) — already done

### Architecture Compliance

- Single `PrismaClient` instance rule: `backend/src/lib/prisma.ts` is the sole instantiation point
- All future route handlers import `{ prisma }` from `'../lib/prisma'`
- camelCase field names in schema → Prisma maps to snake_case PostgreSQL columns automatically
- `userId` is `String?` (nullable) — never enforce it in v1 queries; auth layer adds the filter later
- Schema changes always go through `prisma migrate dev` — never `db push`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Prisma 7.6 generated client has no `index.ts` — correct import is `'../generated/prisma/client'` not `'../generated/prisma'`
- Prisma 7 `PrismaClient` constructor requires a driver adapter — installed `@prisma/adapter-pg` + `pg`; singleton now uses `new PrismaPg({ connectionString: process.env.DATABASE_URL })`
- Story Dev Notes specified `new PrismaClient()` with no args — this pattern was Prisma 5/6; Prisma 7 mandates driver adapter instantiation
- Datasource block in `schema.prisma` must NOT have `url` field in Prisma 7 — URL lives only in `prisma.config.ts` (regression from code review P1 patch was reverted correctly)
- PostgreSQL 17 not available — using Homebrew PostgreSQL 15 running on localhost:5432 (schema-compatible, no behavioral difference for this story)
- `DATABASE_URL_TEST` swap handled in `vitest.config.ts` by reassigning `process.env.DATABASE_URL` before defineConfig

### Completion Notes List

- AC#1 ✅ `backend/prisma/schema.prisma` defines Todo model with exact 6 fields; `npx prisma validate` exits 0
- AC#2 ✅ `prisma migrate dev --name init` created `20260501084308_init/migration.sql`; Todo table verified in DB
- AC#3 ✅ `backend/src/lib/prisma.ts` is sole instantiation point; confirmed via grep
- AC#4 ✅ DB query confirms Todo table with exactly 6 columns (id, text, completed, createdAt, updatedAt, userId)

### File List

- `backend/prisma/schema.prisma` (modified — Todo model added)
- `backend/prisma/migrations/20260501084308_init/migration.sql` (created by prisma migrate dev)
- `backend/src/lib/prisma.ts` (created — PrismaClient singleton with PrismaPg adapter)
- `backend/src/lib/prisma.test.ts` (created — smoke test)
- `backend/src/generated/prisma/` (created by prisma generate — gitignored)
- `backend/vitest.config.ts` (updated — dotenv loaded, DATABASE_URL swapped to DATABASE_URL_TEST)
- `backend/.env` (updated — correct DATABASE_URL and DATABASE_URL_TEST for local Homebrew PG)
- `backend/package.json` (updated — added @prisma/adapter-pg, pg, @types/pg)
