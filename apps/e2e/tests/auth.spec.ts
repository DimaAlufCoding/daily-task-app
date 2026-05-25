import { test, expect } from '@playwright/test'
import { login, testAdmin } from './helpers/auth'

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
