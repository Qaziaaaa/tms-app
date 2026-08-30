import { test, expect } from "@playwright/test";
import { loginTeacherBrowser, loginStudentBrowser, STUDENT, TEACHER } from "./fixtures";

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
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator("text=Email is required").first()).toBeVisible();
  });

  test("unauthenticated user redirected to login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/, { timeout: 10000 });
  });

  test("student cannot access teacher routes", async ({ page }) => {
    await loginStudentBrowser(page);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/student\/dashboard/, { timeout: 10000 });
  });

  test("teacher credentials are rejected from the student portal", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("tab", { name: "Student" }).click();
    await page.getByLabel("Email or Roll Number").fill(TEACHER.email);
    await page.getByLabel("Password").fill(TEACHER.password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByText("Invalid email or password. Please check your credentials and try again.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("student credentials are rejected from the teacher portal", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(STUDENT.email);
    await page.getByLabel("Password").fill(STUDENT.password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByText("Invalid email or password. Please check your credentials and try again.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("student can sign in with roll number", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("tab", { name: "Student" }).click();
    await page.getByLabel("Email or Roll Number").fill("CS-2024-001");
    await page.getByLabel("Password").fill(STUDENT.password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page).toHaveURL(/\/student\/dashboard/);
  });
});
