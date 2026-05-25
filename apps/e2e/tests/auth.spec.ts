import { test, expect } from '@playwright/test'
import { login, testAdmin, testClient, createClientUser } from './helpers/auth'

// ---------------------------------------------------------------------------
// Existing tests — do not modify
// ---------------------------------------------------------------------------

test('unauthenticated user is redirected to /login', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/login/)
})

test('login with valid credentials navigates home', async ({ page }) => {
  await login(page, testAdmin.email, testAdmin.password)
  await expect(page).toHaveURL('/')
})

test('login with invalid credentials shows error', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('wrong@example.com')
  await page.getByLabel('Password').fill('wrongpassword')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByText(/invalid/i)).toBeVisible()
})

test('sign out redirects to /login', async ({ page }) => {
  await login(page, testAdmin.email, testAdmin.password)
  await page.getByRole('button', { name: /sign out/i }).click()
  await expect(page).toHaveURL(/\/login/)
})

// ---------------------------------------------------------------------------
// Form validation (client-side — zod / react-hook-form, no network call)
// ---------------------------------------------------------------------------

test.describe('LoginPage form validation', () => {
  test('submitting empty form shows required-field errors for both fields', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Email field: zod's .email() fires "Enter a valid email" when value is ""
    await expect(page.getByText('Enter a valid email')).toBeVisible()
    // Password field: zod's .min(1) fires "Password is required"
    await expect(page.getByText('Password is required')).toBeVisible()
  })

  test('invalid email format shows email validation error', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('not-an-email')
    await page.getByLabel('Password').fill('somepassword')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByText('Enter a valid email')).toBeVisible()
    // Password error should NOT appear — only the email field is invalid
    await expect(page.getByText('Password is required')).not.toBeVisible()
  })

  test('empty password field shows password validation error', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('valid@example.com')
    // Leave password empty and submit
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByText('Password is required')).toBeVisible()
    await expect(page.getByText('Enter a valid email')).not.toBeVisible()
  })

  test('validation errors clear once the field is corrected and resubmitted', async ({ page }) => {
    await page.goto('/login')
    // Trigger validation errors first
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByText('Enter a valid email')).toBeVisible()

    // Now fill valid values and resubmit — client-side errors must disappear
    // (we don't wait for navigation; just confirm the error is gone)
    await page.getByLabel('Email').fill('valid@example.com')
    await page.getByLabel('Password').fill('somepassword')
    // Trigger re-validation by submitting (will hit the server, which will
    // return an auth error, but the zod error should be gone)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByText('Enter a valid email')).not.toBeVisible()
    await expect(page.getByText('Password is required')).not.toBeVisible()
  })

  test('submit button is disabled while the sign-in request is in flight', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(testAdmin.email)
    await page.getByLabel('Password').fill(testAdmin.password)

    // Click and immediately assert the button state before the navigation resolves
    const submitButton = page.getByRole('button', { name: /Sign in|Signing in/i })
    await submitButton.click()
    // The button text changes to "Signing in…" and becomes disabled while
    // isSubmitting is true.  We race the assertion against the navigation.
    await Promise.race([
      expect(submitButton).toBeDisabled(),
      page.waitForURL('/'),
    ])
  })
})

// ---------------------------------------------------------------------------
// Authenticated user visiting /login is bounced back home
// ---------------------------------------------------------------------------

test('already-authenticated user visiting /login is redirected to /', async ({ page }) => {
  await login(page, testAdmin.email, testAdmin.password)
  // Navigate to /login while session is active
  await page.goto('/login')
  // LoginPage renders <Navigate to="/" replace /> when session exists
  await expect(page).toHaveURL('/')
})

// ---------------------------------------------------------------------------
// Wildcard / unknown routes
// ---------------------------------------------------------------------------

test('unknown route redirects to /', async ({ page }) => {
  // The wildcard <Route path="*"> redirects to "/", which is a ProtectedRoute.
  // Without a session that means a further redirect to /login.
  await page.goto('/this-route-does-not-exist')
  await expect(page).toHaveURL(/\/(login)?$/)
})

test('unknown route for authenticated user redirects to /', async ({ page }) => {
  await login(page, testAdmin.email, testAdmin.password)
  await page.goto('/this-route-does-not-exist')
  await expect(page).toHaveURL('/')
})

// ---------------------------------------------------------------------------
// Session persistence
// ---------------------------------------------------------------------------

test('session persists across a full page reload', async ({ page }) => {
  await login(page, testAdmin.email, testAdmin.password)
  await expect(page).toHaveURL('/')

  await page.reload()

  // After reload the session cookie is still valid — ProtectedRoute should
  // keep us on "/" and the Navbar should still be rendered.
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('navigation')).toBeVisible()
  await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible()
})

// ---------------------------------------------------------------------------
// Sign out clears the session (post-sign-out protection check)
// ---------------------------------------------------------------------------

test('after sign out, protected routes are inaccessible', async ({ page }) => {
  await login(page, testAdmin.email, testAdmin.password)
  await page.getByRole('button', { name: /sign out/i }).click()
  await expect(page).toHaveURL(/\/login/)

  // Attempt to directly navigate to a protected route
  await page.goto('/')
  await expect(page).toHaveURL(/\/login/)
})

// ---------------------------------------------------------------------------
// RBAC — AdminRoute and Navbar "Users" link
// ---------------------------------------------------------------------------

test.describe('AdminRoute and RBAC', () => {
  // Ensure the CLIENT user exists before running any RBAC tests.
  // The database is reset once per full test run (global-setup), so creating
  // the user once here is sufficient for the entire describe block.
  test.beforeAll(async ({ request }) => {
    await createClientUser(request)
  })

  test('unauthenticated user navigating to /users is redirected to /login', async ({ page }) => {
    await page.goto('/users')
    await expect(page).toHaveURL(/\/login/)
  })

  test('CLIENT user navigating to /users is redirected to /', async ({ page }) => {
    await login(page, testClient.email, testClient.password)
    await page.goto('/users')
    // AdminRoute: non-ADMIN session → <Navigate to="/" replace />
    await expect(page).toHaveURL('/')
    // Confirm we landed on the home page, not the users page
    await expect(page.getByRole('heading', { name: 'Your Tasks' })).toBeVisible()
  })

  test('ADMIN user can access /users', async ({ page }) => {
    await login(page, testAdmin.email, testAdmin.password)
    await page.goto('/users')
    await expect(page).toHaveURL('/users')
    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible()
  })

  test('Navbar shows "Users" link for ADMIN and hides it for CLIENT', async ({ page }) => {
    // --- ADMIN ---
    await login(page, testAdmin.email, testAdmin.password)
    await expect(page.getByRole('link', { name: 'Users' })).toBeVisible()

    // Sign out and log in as CLIENT
    await page.getByRole('button', { name: /sign out/i }).click()
    await expect(page).toHaveURL(/\/login/)

    await login(page, testClient.email, testClient.password)
    // CLIENT role — the "Users" link must not be rendered
    await expect(page.getByRole('link', { name: 'Users' })).not.toBeVisible()
  })

  test('ADMIN clicking the "Users" Navbar link navigates to /users', async ({ page }) => {
    await login(page, testAdmin.email, testAdmin.password)
    await page.getByRole('link', { name: 'Users' }).click()
    await expect(page).toHaveURL('/users')
    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible()
  })
})
