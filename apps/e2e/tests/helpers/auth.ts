import { Page, APIRequestContext } from '@playwright/test'

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('/')
}

export const testAdmin = {
  email: process.env.TEST_ADMIN_EMAIL!,
  password: process.env.TEST_ADMIN_PASSWORD!,
}

export const testClient = {
  name: 'Client User',
  email: 'client@test.local',
  password: 'TestClient123!',
}

/**
 * Register a CLIENT user via the better-auth sign-up endpoint.
 * Safe to call multiple times — ignores 422 (already exists).
 */
export async function createClientUser(request: APIRequestContext) {
  const response = await request.post('http://localhost:3001/api/auth/sign-up/email', {
    data: {
      name: testClient.name,
      email: testClient.email,
      password: testClient.password,
    },
  })
  // 200 = created, 422 = already exists — both are acceptable
  if (!response.ok() && response.status() !== 422) {
    throw new Error(
      `Failed to create CLIENT test user: ${response.status()} ${await response.text()}`
    )
  }
}
