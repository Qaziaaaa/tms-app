import { test, expect } from "@playwright/test";
import { loginBrowser } from "./fixtures";

test.describe("Phase 11: Reports E2E", () => {
  test.beforeEach(async ({ page }) => {
    await loginBrowser(page);
    await page.goto("/reports");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
  });

  test("reports page loads with heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Reports" })).toBeVisible();
  });

  test("has class selector and attendance/submissions toggle", async ({ page }) => {
    await expect(page.locator("select")).toBeVisible();
    await expect(page.getByRole("button", { name: "Attendance" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Submissions" })).toBeVisible();
  });

  test("attendance report shows student table", async ({ page }) => {
    await expect(page.getByText("Attendance Report")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("columnheader", { name: "Roll" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Name" })).toBeVisible();
  });

  test("can switch to submissions report", async ({ page }) => {
    await expect(page.getByText("Attendance Report")).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "Submissions" }).click();
    await expect(page.getByText("Submissions Report")).toBeVisible({ timeout: 10000 });
  });

  test("can switch class selector", async ({ page }) => {
    const select = page.locator("select");
    const opts = await select.locator("option").count();
    if (opts > 1) {
      await select.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
    }
    await expect(page.getByText("Attendance Report")).toBeVisible();
  });
});
