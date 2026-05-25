---
name: auth-test-infrastructure
description: Test users, helper functions, CLIENT user creation via better-auth API, and credentials used in e2e auth tests
metadata:
  type: project
---

## Test Users

**ADMIN user** — seeded in `global-setup.ts` via `apps/server/prisma/seed.ts`:
- email: `admin@test.local` (from `TEST_ADMIN_EMAIL` env var)
- password: `TestAdmin123!` (from `TEST_ADMIN_PASSWORD` env var)
- role: `ADMIN`

**CLIENT user** — created at runtime via `createClientUser()` in `beforeAll`:
- email: `client@test.local`
- password: `TestClient123!`
- role: `CLIENT` (better-auth default)
- NOT seeded in global-setup — must be created in tests that need it

## Helper File

Location: `apps/e2e/tests/helpers/auth.ts`

Exports:
- `login(page, email, password)` — fills the login form and waits for URL `/`
- `testAdmin` — `{ email, password }` from env vars
- `testClient` — `{ name, email, password }` hardcoded constants
- `createClientUser(request: APIRequestContext)` — POSTs to `http://localhost:3001/api/auth/sign-up/email`, safe to call multiple times (ignores 422)

## CLIENT User Creation Pattern

```ts
test.beforeAll(async ({ request }) => {
  await createClientUser(request)
})
```

Use `test.beforeAll` with `{ request }` fixture — not `{ page }`. The `request` fixture in Playwright's `beforeAll` is an `APIRequestContext` scoped to the worker.

The better-auth sign-up endpoint is `/api/auth/sign-up/email` and expects `{ name, email, password }`.

**Why:** The test database is reset in global-setup (once per run), so a CLIENT user doesn't exist at test start. Creating it lazily in `beforeAll` of the describe block that needs it avoids coupling the global seed to test-specific users.
