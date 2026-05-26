import { test, expect } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import { login, testAdmin } from './helpers/auth'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Module-level counter — ensures each test gets a unique email within a run.
let seq = 0
function nextUser() {
  seq++
  return {
    name: `E2E User ${seq}`,
    email: `e2e-user-${seq}@test.local`,
    password: 'E2ePass99!',
  }
}

/**
 * Registers a user via the public sign-up endpoint (no admin auth required).
 * Returns a CLIENT user that will appear in the /api/users list.
 */
async function signUpUser(
  request: APIRequestContext,
  user: { name: string; email: string; password: string },
) {
  const res = await request.post('http://localhost:3001/api/auth/sign-up/email', {
    data: { name: user.name, email: user.email, password: user.password },
  })
  if (!res.ok() && res.status() !== 422) {
    throw new Error(`Failed to sign up test user: ${res.status()} ${await res.text()}`)
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('User Management', () => {
  // Log in as admin and land on the Users page before every test.
  test.beforeEach(async ({ page }) => {
    await login(page, testAdmin.email, testAdmin.password)
    await page.goto('/users')
    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // Read
  // -------------------------------------------------------------------------

  test('shows table headers and the seeded admin row', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Role' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Joined' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Actions' })).toBeVisible()
    // The seeded admin's email must be in the table
    await expect(page.getByText(testAdmin.email)).toBeVisible()
    // The current user's row shows "You"
    await expect(page.getByText('You')).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // Create
  // -------------------------------------------------------------------------

  test('creates a new CLIENT user and shows them in the table', async ({ page }) => {
    const user = nextUser()

    await page.getByRole('button', { name: 'Create User' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.getByLabel('Name').fill(user.name)
    await dialog.getByLabel('Email').fill(user.email)
    await dialog.getByLabel('Password').fill(user.password)
    await dialog.getByRole('button', { name: 'Create User' }).click()

    // Dialog closes and the new row appears
    await expect(dialog).not.toBeVisible()
    await expect(page.getByText(user.name)).toBeVisible()
    await expect(page.getByText(user.email)).toBeVisible()

    // Default role is CLIENT
    const userRow = page.locator('tr', { has: page.getByText(user.email) })
    await expect(userRow.getByText('CLIENT')).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // Update — edit name / email
  // -------------------------------------------------------------------------

  test('edits a user name via the edit dialog and shows the updated name', async ({
    page,
    request,
  }) => {
    const user = nextUser()
    await signUpUser(request, user)
    await page.reload()
    await expect(page.getByText(user.name)).toBeVisible()

    const userRow = page.locator('tr', { has: page.getByText(user.email) })
    await userRow.getByRole('button', { name: 'Edit user' }).click()

    const dialog = page.getByRole('dialog')
    // Fields are pre-populated with the current values
    await expect(dialog.getByLabel('Name')).toHaveValue(user.name)
    await expect(dialog.getByLabel('Email')).toHaveValue(user.email)

    await dialog.getByLabel('Name').clear()
    await dialog.getByLabel('Name').fill(`${user.name} Updated`)
    await dialog.getByRole('button', { name: 'Save Changes' }).click()

    await expect(dialog).not.toBeVisible()
    await expect(page.getByText(`${user.name} Updated`)).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // Update — role toggle
  // -------------------------------------------------------------------------

  test('promotes a CLIENT to ADMIN and demotes back to CLIENT', async ({ page, request }) => {
    const user = nextUser()
    await signUpUser(request, user)
    await page.reload()

    const userRow = page.locator('tr', { has: page.getByText(user.email) })

    // Promote
    await userRow.getByRole('button', { name: 'Promote to Admin' }).click()
    await expect(userRow.getByText('ADMIN')).toBeVisible()
    await expect(userRow.getByRole('button', { name: 'Demote to Client' })).toBeVisible()

    // Demote
    await userRow.getByRole('button', { name: 'Demote to Client' }).click()
    await expect(userRow.getByText('CLIENT')).toBeVisible()
    await expect(userRow.getByRole('button', { name: 'Promote to Admin' })).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // Update — password change
  // -------------------------------------------------------------------------

  test('changed password allows the user to sign in with new credentials', async ({
    page,
    request,
  }) => {
    const user = nextUser()
    const newPassword = 'NewPass99!'

    await signUpUser(request, user)
    await page.reload()

    const userRow = page.locator('tr', { has: page.getByText(user.email) })
    await userRow.getByRole('button', { name: 'Edit user' }).click()

    const dialog = page.getByRole('dialog')
    await dialog.getByLabel(/new password/i).fill(newPassword)
    await dialog.getByRole('button', { name: 'Save Changes' }).click()
    await expect(dialog).not.toBeVisible()

    // Sign out and sign in as the edited user with the new password
    await page.getByRole('button', { name: /sign out/i }).click()
    await expect(page).toHaveURL(/\/login/)

    await login(page, user.email, newPassword)
    await expect(page).toHaveURL('/')
  })

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------

  test('shows the confirmation dialog and removes the user from the table', async ({
    page,
    request,
  }) => {
    const user = nextUser()
    await signUpUser(request, user)
    await page.reload()
    await expect(page.getByText(user.name)).toBeVisible()

    const userRow = page.locator('tr', { has: page.getByText(user.email) })
    await userRow.getByRole('button', { name: 'Delete user' }).click()

    // Confirmation dialog shows the user's name
    const alertDialog = page.getByRole('alertdialog')
    await expect(alertDialog).toBeVisible()
    await expect(alertDialog.getByText(new RegExp(user.name))).toBeVisible()

    await alertDialog.getByRole('button', { name: 'Delete' }).click()

    await expect(alertDialog).not.toBeVisible()
    // Row is gone from the table (soft-deleted on the server)
    await expect(page.getByText(user.name)).not.toBeVisible()
  })
})
