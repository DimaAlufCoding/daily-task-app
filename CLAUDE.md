# Daily Task App

A Jira-style daily task organizer where tasks are managed as tickets on a Kanban board instead of scheduled calendar events.

## Project Structure

```
daily-task-app/         ← Bun monorepo root
├── apps/
│   ├── client/         ← React + TypeScript + Vite (port 5173)
│   └── server/         ← Express + TypeScript + Bun (port 3001)
├── package.json        ← Bun workspaces
└── tsconfig.json       ← Base TypeScript config
```

## Tech Stack

- **Runtime:** Bun
- **Frontend:** React 19, TypeScript, Vite
- **Backend:** Express 5, TypeScript, Bun
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite` plugin) + shadcn/ui (default theme, oklch variables)
- **Auth:** better-auth (email/password, session via `useSession` / `signIn` / `signOut`)
- **Drag & Drop:** dnd-kit (planned)
- **Database:** Supabase (planned)
- **Deployment:** Vercel (planned)

## Commands

Use the full bun path until it is on PATH (`exec zsh` to reload shell after first install):

```bash
# Install all workspace dependencies
~/.bun/bin/bun install

# Start Express API server (hot-reload, port 3001)
cd apps/server && ~/.bun/bin/bun run --watch src/index.ts

# Start React client (HMR, port 5173)
cd apps/client && ~/.bun/bin/bun run --bun vite

# Both from root (once bun is on PATH)
bun run dev:server
bun run dev:client
```

## Key Conventions

- The Vite dev server proxies `/api/*` to `http://localhost:3001` — no CORS issues in development.
- Server entry point: `apps/server/src/index.ts`
- Client entry point: `apps/client/src/main.tsx`
- All API routes are prefixed with `/api/`.
- Path alias `@/*` → `./src/*` is configured in both `tsconfig.json` and `vite.config.ts`.

## shadcn/ui

shadcn/ui is installed with the **default theme** (Tailwind v4, `@theme inline` syntax, oklch color space).

- Components live in `apps/client/src/components/ui/`
- Utility helper: `import { cn } from '@/lib/utils'`
- Add new components: `~/.bun/bin/bunx shadcn@latest add <component>`
- Installed so far: `button`, `card`, `input`, `label`
- Tailwind v4 note: no `tailwind.config.js` — all config is in `src/index.css` via `@theme inline`. Uses `tw-animate-css` (not `tailwindcss-animate`).

## Authentication

better-auth handles auth on both client and server.

- Client helpers: `useSession`, `signIn`, `signOut` from `apps/client/src/lib/auth-client.ts`
- `ProtectedRoute` in `App.tsx` guards routes, redirecting to `/login` if no session
- `AdminRoute` in `App.tsx` guards admin-only routes — redirects non-admins to `/`, unauthenticated users to `/login`
- `LoginPage.tsx` uses react-hook-form + zod for validation

## Roles

Prisma `Role` enum: `ADMIN` | `CLIENT` (default `CLIENT`).

- Server exposes role in session via `user.additionalFields.role` in `apps/server/src/lib/auth.ts`
- Client infers the type via `inferAdditionalFields` plugin in `apps/client/src/lib/auth-client.ts`
- Check role with `session.user.role === 'ADMIN'`
- Admin-only pages use `<AdminRoute>` in `App.tsx`
- `Navbar` shows a "Users" link only when `session.user.role === 'ADMIN'`

## Layout & Theming

- `ThemeProvider` (`src/components/ThemeProvider.tsx`) — React context for `light | dark | system`; persists to `localStorage`; toggles `dark` class on `<html>`. Mounted at the root in `main.tsx`.
- `Layout` (`src/components/Layout.tsx`) — wrapper for authenticated pages; renders `<Navbar>` + `<main>`. All new authenticated pages should use `<Layout>` as their root element.
- `Navbar` includes a Moon/Sun theme toggle, Sign out button, and a "Users" link (admin only).

## E2E Testing

Tests live in `apps/e2e/` and run against an isolated Supabase schema (`daily_task_test`).

To write new tests, use the **`playwright-e2e-writer`** agent — it knows the project structure, test DB setup, auth helpers, and Playwright conventions for this codebase.

```
# Invoke it by name in any Claude Code session:
playwright-e2e-writer
```

To run existing tests (stop dev servers on 3001/5173 first):

```bash
cd apps/e2e && ~/.bun/bin/bun run test
```

## Documentation

Always use **context7** MCP to fetch up-to-date documentation before using any library or framework. Do not rely on training data for API shapes, configuration, or version-specific behavior.

```
# Resolve a library ID first, then query docs
mcp__context7__resolve-library-id  →  mcp__context7__query-docs
```

Key library IDs:
| Library | context7 ID |
|---------|-------------|
| Bun | `/oven-sh/bun` |
| Express | `/websites/expressjs_en_5` |
| React | `/websites/react_dev` |
| Next.js | `/vercel/next.js` |
| Supabase | `/supabase/supabase` |
| Tailwind CSS | `/tailwindlabs/tailwindcss.com` |
| shadcn/ui | `/shadcn-ui/ui` |
| dnd-kit | `/clauderic/dnd-kit` |
| Vite | `/vitejs/vite` |
