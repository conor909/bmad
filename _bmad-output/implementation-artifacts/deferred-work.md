# Deferred Work

## Deferred from: code review of 1-1-initialize-monorepo-project-scaffold (2026-05-01)

- `prisma.config.ts` passes `DATABASE_URL` as `string | undefined` with no guard or early exit — Story 1.4 owns env configuration and is the right place to harden this

## Deferred from: code review of 1-2-todo-data-model-initial-database-migration (2026-05-01)

- **[Decision→Defer]** Import path `'../generated/prisma/client'` vs spec's `'../generated/prisma'` — Prisma 7 generated client has no `index.ts`; spec was written for Prisma 5/6. Update story spec templates to use `/client` suffix.
- **[Decision→Defer]** `PrismaPg` driver adapter pattern vs spec's bare `new PrismaClient()` — Prisma 7 requires a driver adapter; spec's pattern is invalid in v7. Update spec templates to document the adapter requirement.
- **[Decision→Defer]** `vitest.config.ts` DATABASE_URL swap not in spec's prescribed implementation — spec example is incomplete; it describes what to load but not how to route to the test DB. Clarify the DATABASE_URL_TEST wiring in future story specs.
- `globalThis` singleton pattern reuses a stale/disconnected client if the module hot-reloads without disconnecting the previous client — known tradeoff, not actionable without a lifecycle framework
- `userId` field has no FK constraint or index — auth enforcement deliberately deferred; index can be added when the User model is introduced in a future story
- No down/rollback migration generated — Prisma doesn't generate down migrations by default; document rollback strategy before production
- `dotenv/config` in `backend/src/index.ts` uses the default `.env` path (process cwd), fragile when server is started from a non-`backend/` directory — consider `dotenv.config({ path: path.join(__dirname, '../.env') })` in a future hardening story
- `Todo.text` has no length constraint — unlimited TEXT column; add Zod validation at the API layer in Story 2.1 (CRUD API)
- `helmet` and `cors` installed as dependencies but not applied in `backend/src/app.ts` — Story 1.3 adds middleware, routes, and security headers
- `CORS_ORIGIN` env var defined in `.env.example` but not consumed anywhere — Story 1.3 will wire up cors middleware with this value
