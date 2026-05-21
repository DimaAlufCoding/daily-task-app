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
- **Styling:** Tailwind CSS + shadcn/ui (planned)
- **Drag & Drop:** dnd-kit (planned)
- **Database & Auth:** Supabase (planned)
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
