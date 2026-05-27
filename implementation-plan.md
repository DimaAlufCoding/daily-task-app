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

## Phase 4 — Email-to-Ticket Integration

20. Create Mailgun account and configure inbound email routing
21. Configure dedicated inbound email domain/subdomain
22. Add webhook endpoint for incoming Mailgun events
23. Verify webhook signature/security validation
24. Parse incoming email payload (sender, subject, body)
25. Match sender email to existing user account
26. Automatically create ticket from email
27. Map:

* email subject → ticket title
* email body → ticket description

28. Assign created ticket to current daily board
29. Add fallback handling for unknown senders
30. Add webhook logging and error handling
31. Add local development webhook testing workflow

---

## Phase 5 — Kanban Board

32. Board layout: 4 columns (To Do / In Progress / Done / Move to Next Day)
33. Install and configure `dnd-kit`
34. Drag-and-drop between columns — update ticket status on drop
35. Column headers with task count
36. Empty state per column

---

## Phase 6 — Daily Board Lifecycle

37. Logic to auto-generate the day's board on first load (based on current date)
38. On app load: check if today's board exists; create it if not
39. Rollover logic: tickets in "Move to Next Day" appear in next day's "To Do"
40. End-of-day archiving: mark completed tickets as archived (background job or on-demand)

---

## Phase 7 — Ticket Features & Filtering

41. Ticket detail modal (full view with all fields)
42. Category filter (Health / Work / Shopping / Personal)
43. Priority filter (Low / Medium / High)
44. Sort options (priority, creation date, category)
45. Search bar (filter by title)
46. Predefined ticket templates (e.g., "Go to the gym", "Review emails")
47. Custom ticket creation flow

---

## Phase 8 — Progress Tracking

48. Daily progress bar (completed / total tickets)
49. Weekly summary stats (completion rate per day)
50. Progress widget on the board header

---

## Phase 9 — UI Polish & Responsive Design

51. Mobile-first layout for the Kanban board (horizontal scroll or stacked columns)
52. Loading skeletons for board and ticket list
53. Toast notifications for actions (created, moved, deleted)
54. Error boundary and error states
55. Empty state for new users (first-day onboarding prompt)

---

## Phase 10 — Admin Panel

56. Admin-only route guard
57. User list view (email, status, join date)
58. Deactivate / reactivate user account
59. Trigger password reset for a user

---

## Phase 11 — Deployment & Production Hardening

60. Set up production Supabase project
61. Configure Vercel project and environment variables
62. Configure Mailgun production webhook domain
63. Deploy to Vercel
64. Smoke test: auth, board generation, drag-and-drop, rollover, email-to-ticket flow
65. Set up Supabase real-time subscriptions (sync across devices)

---

> **Suggested order of execution:** Phases 1–4 establish the core data creation flows. Phase 5 is the core board UI. Phases 6–7 complete the product logic. Phases 8–11 focus on polish, infrastructure, and production readiness.
