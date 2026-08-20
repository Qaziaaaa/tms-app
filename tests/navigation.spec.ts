import { test, expect } from "@playwright/test";
import { loginBrowser } from "./fixtures";

test.describe("Phase 13: Navigation E2E", () => {
  test.beforeEach(async ({ page }) => {
    await loginBrowser(page);
  });

  test("sidebar has all navigation links", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Classes" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Students" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Attendance" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Assignments" })).toBeVisible();
    await expect(page.getByRole("link", { name: "AI Insights" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Reports" })).toBeVisible();
  });

  test("can navigate to all pages without errors", async ({ page }) => {
    const routes = ["/classes", "/students", "/attendance", "/assignments", "/insights", "/reports", "/dashboard"];
    for (const route of routes) {
      const res = await page.goto(route);
      expect(res?.status()).toBeLessThan(500);
    }
  });

  test("dashboard shows stats cards", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Your Classes")).toBeVisible();
    await expect(page.getByRole("main").getByText("Students", { exact: true })).toBeVisible();
    await expect(page.getByRole("main").getByText("Sessions", { exact: true })).toBeVisible();
    await expect(page.getByRole("main").getByText("Assignments", { exact: true })).toBeVisible();
  });
});
