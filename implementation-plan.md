# Implementation Plan

## Phase 1 — Project Setup & Foundation

1. Initialize Next.js project with TypeScript
2. Configure Tailwind CSS
3. Install and configure shadcn/ui
4. Create Supabase project (dev environment)
5. Set up environment variables (`.env.local`)
6. Define folder structure (`/app`, `/components`, `/lib`, `/types`, `/hooks`)
7. Set up path aliases and base TypeScript config

---

## Phase 2 — Database Schema & Authentication

8. Design and create Supabase tables: `users`, `tickets`, `categories`, `templates`, `daily_boards`
9. Define TypeScript types matching the schema
10. Enable Row-Level Security (RLS) policies per table
11. Implement email/password auth with Supabase Auth
12. Build login and register pages
13. Add session management (middleware to protect routes)
14. Add password reset flow

---

## Phase 3 — Ticket CRUD

15. API routes (Next.js Route Handlers) for ticket create, read, update, delete
16. Supabase client utility (`/lib/supabase`)
17. Ticket form component (add/edit)
18. Ticket card component (title, category, priority badge)
19. Delete confirmation dialog

---

## Phase 4 — Kanban Board

20. Board layout: 4 columns (To Do / In Progress / Done / Move to Next Day)
21. Install and configure `dnd-kit`
22. Drag-and-drop between columns — update ticket status on drop
23. Column headers with task count
24. Empty state per column

---

## Phase 5 — Daily Board Lifecycle

25. Logic to auto-generate the day's board on first load (based on current date)
26. On app load: check if today's board exists; create it if not
27. Rollover logic: tickets in "Move to Next Day" appear in next day's "To Do"
28. End-of-day archiving: mark completed tickets as archived (background job or on-demand)

---

## Phase 6 — Ticket Features & Filtering

29. Ticket detail modal (full view with all fields)
30. Category filter (Health / Work / Shopping / Personal)
31. Priority filter (Low / Medium / High)
32. Sort options (priority, creation date, category)
33. Search bar (filter by title)
34. Predefined ticket templates (e.g., "Go to the gym", "Review emails")
35. Custom ticket creation flow

---

## Phase 7 — Progress Tracking

36. Daily progress bar (completed / total tickets)
37. Weekly summary stats (completion rate per day)
38. Progress widget on the board header

---

## Phase 8 — UI Polish & Responsive Design

39. Mobile-first layout for the Kanban board (horizontal scroll or stacked columns)
40. Loading skeletons for board and ticket list
41. Toast notifications for actions (created, moved, deleted)
42. Error boundary and error states
43. Empty state for new users (first-day onboarding prompt)

---

## Phase 9 — Admin Panel

44. Admin-only route guard
45. User list view (email, status, join date)
46. Deactivate / reactivate user account
47. Trigger password reset for a user

---

## Phase 10 — Deployment & Production Hardening

48. Set up production Supabase project
49. Configure Vercel project and environment variables
50. Deploy to Vercel
51. Smoke test: auth, board generation, drag-and-drop, rollover
52. Set up Supabase real-time subscriptions (sync across devices)

---

> **Suggested order of execution:** Phases 1–3 give you a working data layer fast. Phase 4 is the core UI. Phases 5–6 complete the product logic. Phases 7–10 are polish and production.
