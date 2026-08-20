import { test, expect } from "@playwright/test";
import { loginBrowser } from "./fixtures";

test.describe("Phase 12: AI Insights E2E", () => {
  test.beforeEach(async ({ page }) => {
    await loginBrowser(page);
    await page.goto("/insights");
    await page.waitForTimeout(500);
  });

  test("insights page loads with heading and class selector", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "AI Insights" })).toBeVisible();
    await expect(page.locator("select")).toBeVisible();
  });

  test("Refresh Analysis button is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Refresh Analysis/ })).toBeVisible();
  });

  test("clicking Refresh Analysis loads insights", async ({ page }) => {
    test.setTimeout(30000);
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: /Refresh Analysis/ }).click();
    await page.waitForTimeout(5000);
    await expect(page.getByText("Avg Attendance")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Avg Submission Rate")).toBeVisible();
    await expect(page.getByText("At-Risk Students")).toBeVisible();
  });

  test("insights show student risk analysis table", async ({ page }) => {
    test.setTimeout(30000);
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: /Refresh Analysis/ }).click();
    await page.waitForTimeout(5000);
    await expect(page.getByText("Student Risk Analysis")).toBeVisible({ timeout: 15000 });
    const text = await page.locator("body").textContent();
    expect(text).toContain("Roll");
  });

  test("AI Analysis section is visible after load", async ({ page }) => {
    test.setTimeout(30000);
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: /Refresh Analysis/ }).click();
    await page.waitForTimeout(5000);
    await expect(page.getByText("AI Analysis")).toBeVisible({ timeout: 15000 });
  });

  test("can switch classes and reload", async ({ page }) => {
    test.setTimeout(30000);
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: /Refresh Analysis/ }).click();
    await page.waitForTimeout(5000);
    const select = page.locator("select");
    const opts = await select.locator("option").count();
    if (opts > 1) {
      await select.selectOption({ index: 1 });
      await page.waitForTimeout(5000);
    }
    await expect(page.getByRole("heading", { name: "AI Insights" })).toBeVisible();
  });
});
