# Tech Stack

## Frontend

* **Next.js (React + TypeScript)** — frontend framework with routing and SSR
* **Tailwind CSS** — fast responsive styling, mobile-first
* **shadcn/ui** — customizable component system (cards, modals, dropdowns)
* **dnd-kit** — drag and drop for the Kanban board

## Backend

* **Node.js + Express + TypeScript** — dedicated API server
* **Prisma** — ORM and database migrations
* **Mailgun Webhooks** — incoming email processing for automatic ticket creation

## Database

* **PostgreSQL (Supabase)** — primary data store and managed infrastructure

## Authentication

* **Supabase Auth** — email/password and Google OAuth authentication

## Hosting

* **Vercel** — zero-config deployment for Next.js

## External Services

* **Mailgun** — inbound email routing and webhook delivery

## Why This Stack

The stack provides a clean separation between frontend and backend while keeping everything TypeScript end-to-end.

Supabase handles managed PostgreSQL, authentication, and cloud infrastructure, while Express provides full control over business logic and APIs.

Mailgun allows reliable inbound email handling so users can create tickets directly from their inbox.

The overall architecture is optimized for rapid MVP development while remaining scalable for future features.

## Alternative (Self-Hosted)

If Supabase vendor lock-in becomes a concern:

* **Prisma + PostgreSQL on Railway** instead of Supabase
* **NextAuth** instead of Supabase Auth
