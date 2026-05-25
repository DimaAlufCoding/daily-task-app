---
name: auth-component-structure
description: LoginPage locators, exact error message strings, ProtectedRoute/AdminRoute redirect logic, and Navbar RBAC element structure
metadata:
  type: project
---

## LoginPage (`apps/client/src/pages/LoginPage.tsx`)

Form fields use shadcn `<Label>` + `<Input>` with `htmlFor`/`id` pairs:
- `<Label htmlFor="email">Email</Label>` + `<Input id="email">` → `page.getByLabel('Email')`
- `<Label htmlFor="password">Password</Label>` + `<Input id="password">` → `page.getByLabel('Password')`
- Submit: `<Button type="submit">Sign in</Button>` → `page.getByRole('button', { name: 'Sign in' })`

### Client-side validation error messages (zod schema)
- Empty/invalid email: `"Enter a valid email"` — rendered in `<p className="text-xs text-destructive">`
- Empty password: `"Password is required"` — same element pattern

### Server error display
- Shown in: `<p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">`
- Content: whatever `result.error.message` returns from better-auth, or fallback `"Invalid credentials"`
- Existing test uses `/invalid/i` regex which covers better-auth's actual error text

### Loading state
- `isSubmitting` → button text becomes `"Signing in…"` and `disabled={true}`

### Already-authenticated redirect
- `if (session) return <Navigate to="/" replace />` at top of component
- So `page.goto('/login')` while logged in → ends up at `/`

## ProtectedRoute

- `isPending` → shows spinner (no meaningful locator needed)
- `!session` → `<Navigate to="/login" replace />`
- `session` → renders children

## AdminRoute

- `!session` → `<Navigate to="/login" replace />`
- `session.user.role !== 'ADMIN'` → `<Navigate to="/" replace />`
- `ADMIN` → renders children

## Wildcard Route

`<Route path="*" element={<Navigate to="/" replace />}` — redirects to `/`, then `ProtectedRoute` kicks in:
- Unauthenticated: `/` → `/login`
- Authenticated: stays at `/`

## Navbar (`apps/client/src/components/Navbar.tsx`)

- Rendered inside `<nav>` → accessible via `page.getByRole('navigation')`
- "Users" link: `<Link to="/users">Users</Link>` — rendered only when `session?.user?.role === 'ADMIN'`
  - Locator: `page.getByRole('link', { name: 'Users' })`
- Sign out: `<Button variant="outline" size="sm">Sign out</Button>`
  - Locator: `page.getByRole('button', { name: /sign out/i })`
- Greeting: `Hello, <strong>{userName}</strong>` — userName is `session.user.name ?? session.user.email ?? 'User'`

## Page Headings

- HomePage (`/`): `<h1>Your Tasks</h1>` → `page.getByRole('heading', { name: 'Your Tasks' })`
- UserPage (`/users`): `<h1>User Management</h1>` → `page.getByRole('heading', { name: 'User Management' })`
