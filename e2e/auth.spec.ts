import { test, expect } from "@playwright/test"

test.describe("Authentication", () => {
  test("should load the home page", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")

    // Home page should have the brand name or main heading
    await expect(
      page.locator("text=/mobial/i").first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test("should redirect unauthenticated users from settings", async ({ page }) => {
    await page.goto("/settings")
    await page.waitForLoadState("networkidle")

    // Should show sign-in prompt since user is not authenticated
    await expect(
      page.locator("text=/sign in/i").first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test("should redirect unauthenticated users from dashboard", async ({ page }) => {
    await page.goto("/dashboard")
    await page.waitForLoadState("networkidle")

    // Should show sign-in prompt or redirect
    await expect(
      page.locator("text=/sign in|log in|welcome/i").first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test("should redirect unauthenticated users from orders page", async ({ page }) => {
    await page.goto("/orders")
    await page.waitForLoadState("networkidle")

    // Should show sign-in prompt
    await expect(
      page.locator("text=/sign in|log in/i").first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test("should open auth modal with email input via /login", async ({ page }) => {
    // /login opens the auth modal and redirects to /. The modal exposes an email input.
    await page.goto("/login")
    await page.waitForLoadState("networkidle")

    await expect(
      page.locator('input[type="email"], input[placeholder*="email" i]').first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test("should show password input in auth modal", async ({ page }) => {
    await page.goto("/login")
    await page.waitForLoadState("networkidle")

    await expect(
      page.locator('input[type="password"]').first()
    ).toBeVisible({ timeout: 10_000 })
  })
})
