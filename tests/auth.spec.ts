import { test, expect } from "@playwright/test";
import { loginTeacherBrowser, loginStudentBrowser, TEACHER, STUDENT } from "./fixtures";

test.describe("Authentication", () => {
  test("teacher can login and reach dashboard", async ({ page }) => {
    await loginTeacherBrowser(page);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator("text=Dashboard")).toBeVisible();
  });

  test("student can login and reach student dashboard", async ({ page }) => {
    await loginStudentBrowser(page);
    await expect(page).toHaveURL(/\/student\/dashboard/);
    await expect(page.locator("text=Welcome back")).toBeVisible();
  });

  test("wrong password shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(TEACHER.email);
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/);
  });

  test("empty fields prevent submission", async ({ page }) => {
    await page.goto("/login");
    const btn = page.getByRole("button", { name: "Sign In" });
    await expect(btn).toBeDisabled();
  });

  test("unauthenticated user redirected to login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/, { timeout: 10000 });
  });

  test("student cannot access teacher routes", async ({ page }) => {
    await loginStudentBrowser(page);
    await page.goto("/dashboard");
    await page.waitForTimeout(2000);
    await expect(page).not.toHaveURL(/\/dashboard$/);
  });
});
