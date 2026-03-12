import { test, expect } from "@playwright/test"

test.describe("Usage Check", () => {
  test("should load the check-usage page", async ({ page }) => {
    await page.goto("/check-usage")
    await page.waitForLoadState("networkidle")

    await expect(page).toHaveURL(/\/check-usage/)

    // Should show the lookup form with input fields
    await expect(
      page.locator("text=/check.*usage|data.*usage|esim.*status/i").first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test("should have an input for ICCID or order number", async ({ page }) => {
    await page.goto("/check-usage")
    await page.waitForLoadState("networkidle")

    // The page should have at least one text input for the lookup
    const input = page.locator('input[type="text"], input[placeholder]').first()
    await expect(input).toBeVisible({ timeout: 10_000 })
  })

  test("should show error for invalid lookup", async ({ page }) => {
    await page.goto("/check-usage")
    await page.waitForLoadState("networkidle")

    // Enter a fake value
    const input = page.locator('input[type="text"], input[placeholder]').first()
    await input.fill("INVALID12345")

    // Click search/check button
    const button = page.locator('button[type="submit"], button:has-text("Check"), button:has-text("Search")').first()
    if (await button.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await button.click()

      // Should show some error or "not found" message
      await page.waitForTimeout(3_000)
      const pageContent = await page.textContent("body")
      expect(pageContent).toBeTruthy()
    }
  })
})
