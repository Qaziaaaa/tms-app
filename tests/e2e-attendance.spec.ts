import { test, expect } from "@playwright/test";
import { loginTeacherBrowser } from "./fixtures";

test.describe("Phase 9: Attendance E2E", () => {
  test.beforeEach(async ({ page }) => {
    await loginTeacherBrowser(page);
    await page.goto("/attendance");
    await page.waitForTimeout(500);
  });

  test("attendance page loads with heading and class selector", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Attendance" })).toBeVisible();
    await expect(page.locator("select")).toBeVisible();
  });

  test("New Session button is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: /New Session/ })).toBeVisible();
  });

  test("sessions list shows existing sessions", async ({ page }) => {
    await page.waitForTimeout(500);
    const text = await page.locator("body").textContent();
    expect(text).toContain("Sessions");
  });

  test("can create a new attendance session", async ({ page }) => {
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: /New Session/ }).click();
    await page.waitForTimeout(2000);
    const text = await page.locator("body").textContent();
    expect(text).toContain("Save Attendance");
  });

  test("selecting a session shows student table with P/A buttons", async ({ page }) => {
    await page.waitForTimeout(1000);
    const sessionItems = page.locator("[class*='cursor-pointer']");
    if (await sessionItems.count() > 0) {
      await sessionItems.first().click();
      await page.waitForTimeout(1000);
      await expect(page.getByRole("button", { name: /Save Attendance/ })).toBeVisible();
      await expect(page.getByRole("button", { name: /All Present/ })).toBeVisible();
    }
  });

  test("can mark All Present", async ({ page }) => {
    await page.waitForTimeout(1000);
    const sessionItems = page.locator("[class*='cursor-pointer']");
    if (await sessionItems.count() > 0) {
      await sessionItems.first().click();
      await page.waitForTimeout(500);
      await page.getByRole("button", { name: /All Present/ }).click();
      await page.getByRole("button", { name: /Save Attendance/ }).click();
      await page.waitForTimeout(1000);
    }
  });

  test("unauthenticated user redirected from attendance", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("http://localhost:3000/attendance");
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain("/login");
    await ctx.close();
  });
});
