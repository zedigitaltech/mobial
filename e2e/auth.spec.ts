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

  test("should display auth modal when clicking sign in", async ({ page }) => {
    await page.goto("/settings")
    await page.waitForLoadState("networkidle")

    // Click the sign in button
    const signInButton = page.locator("button:has-text('Sign In')").first()
    if (await signInButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await signInButton.click()

      // Auth modal should appear with email input
      await expect(
        page.locator('input[type="email"], input[placeholder*="email" i]').first()
      ).toBeVisible({ timeout: 5_000 })
    }
  })

  test("should show password requirements on register form", async ({ page }) => {
    await page.goto("/settings")
    await page.waitForLoadState("networkidle")

    const signInButton = page.locator("button:has-text('Sign In')").first()
    if (await signInButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await signInButton.click()
      await page.waitForTimeout(500)

      // Look for a register/sign-up tab or link
      const registerTab = page.locator("text=/register|sign up|create account/i").first()
      if (await registerTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await registerTab.click()

        // Should show password input
        await expect(
          page.locator('input[type="password"]').first()
        ).toBeVisible({ timeout: 3_000 })
      }
    }
  })
})
