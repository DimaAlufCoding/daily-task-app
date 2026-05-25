---
name: e2e-project-setup
description: Playwright config, global setup/teardown, .env.test values, workers config, and how the test database is managed
metadata:
  type: project
---

## Config Location

`apps/e2e/playwright.config.ts` — single project (chromium only), `workers: 1`, `fullyParallel: false`. Tests are sequential by design.

## Environment

`apps/e2e/.env.test`:
- `TEST_DATABASE_URL` — Supabase postgres connection string (schema: `daily_task_test`)
- `TEST_BETTER_AUTH_SECRET` — fixed secret for test runs
- `TEST_ADMIN_EMAIL=admin@test.local`
- `TEST_ADMIN_PASSWORD=TestAdmin123!`

## Global Setup (`apps/e2e/global-setup.ts`)

1. Runs `prisma migrate reset --force --skip-seed` against `TEST_DATABASE_URL`
2. Runs `apps/server/prisma/seed.ts` to create the ADMIN user

This runs ONCE per `playwright test` invocation. All tests share a single database state — no per-test isolation.

## Web Servers (started by Playwright)

- Server: `~/.bun/bin/bun run src/index.ts` in `apps/server` — health check at `http://localhost:3001/api/health`
- Client: `~/.bun/bin/bun run --bun vite` in `apps/client` — waits for `http://localhost:5173`
- `reuseExistingServer: false` — Playwright always starts fresh servers

## Running Tests

```bash
cd apps/e2e && ~/.bun/bin/bunx playwright test
# Single file
cd apps/e2e && ~/.bun/bin/bunx playwright test tests/auth.spec.ts
# Headed (useful for debugging)
cd apps/e2e && ~/.bun/bin/bunx playwright test --headed
```
