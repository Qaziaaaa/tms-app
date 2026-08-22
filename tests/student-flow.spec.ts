import { test, expect } from "@playwright/test";
import { loginStudentBrowser, loginStudentAPI } from "./fixtures";

test.describe("Student Portal: Dashboard", () => {
  test("student can login and sees dashboard", async ({ page }) => {
    await loginStudentBrowser(page);
    await expect(page).toHaveURL(/\/student\/dashboard/);
    await expect(page.locator("text=Welcome back")).toBeVisible();
  });

  test("dashboard shows stat cards", async ({ page }) => {
    await loginStudentBrowser(page);
    await page.waitForTimeout(2000);
    const content = await page.content();
    expect(content).toContain("Attendance");
    expect(content).toContain("Assignments");
    expect(content).toContain("Overall Grade");
  });

  test("dashboard shows attendance trend chart", async ({ page }) => {
    await loginStudentBrowser(page);
    await page.waitForTimeout(2000);
    const content = await page.content();
    expect(content).toContain("Attendance Trend");
  });

  test("dashboard shows grade trend chart", async ({ page }) => {
    await loginStudentBrowser(page);
    await page.waitForTimeout(2000);
    const content = await page.content();
    expect(content).toContain("Grade Trend");
  });

  test("dashboard shows recent attendance", async ({ page }) => {
    await loginStudentBrowser(page);
    await page.waitForTimeout(2000);
    const content = await page.content();
    expect(content).toContain("Recent Attendance");
  });

  test("dashboard shows upcoming assignments", async ({ page }) => {
    await loginStudentBrowser(page);
    await page.waitForTimeout(2000);
    const content = await page.content();
    expect(content).toContain("Upcoming Assignments");
  });
});

test.describe("Student Portal: Attendance", () => {
  test("attendance page loads", async ({ page }) => {
    await loginStudentBrowser(page);
    await page.goto("/student/attendance");
    await page.waitForTimeout(2000);
    await expect(page.locator("text=My Attendance")).toBeVisible();
    await expect(page.locator("text=Attendance History")).toBeVisible();
  });

  test("shows monthly chart", async ({ page }) => {
    await loginStudentBrowser(page);
    await page.goto("/student/attendance");
    await page.waitForTimeout(2000);
    const content = await page.content();
    expect(content).toContain("Monthly Attendance");
  });

  test("shows streak", async ({ page }) => {
    await loginStudentBrowser(page);
    await page.goto("/student/attendance");
    await page.waitForTimeout(2000);
    const content = await page.content();
    expect(content).toContain("Current Streak");
  });
});

test.describe("Student Portal: Grades", () => {
  test("grades page loads", async ({ page }) => {
    await loginStudentBrowser(page);
    await page.goto("/student/grades");
    await page.waitForTimeout(2000);
    await expect(page.locator("text=My Grades")).toBeVisible();
    await expect(page.locator("text=Grade Breakdown")).toBeVisible();
  });

  test("shows distribution chart", async ({ page }) => {
    await loginStudentBrowser(page);
    await page.goto("/student/grades");
    await page.waitForTimeout(2000);
    const content = await page.content();
    expect(content).toContain("Grade Distribution");
    expect(content).toContain("Score Trend");
  });
});

test.describe("Student Portal: Assignments", () => {
  test("assignments page loads", async ({ page }) => {
    await loginStudentBrowser(page);
    await page.goto("/student/assignments");
    await page.waitForTimeout(2000);
    await expect(page.locator("text=My Assignments")).toBeVisible();
    await expect(page.locator("text=All Assignments")).toBeVisible();
  });

  test("shows summary stats", async ({ page }) => {
    await loginStudentBrowser(page);
    await page.goto("/student/assignments");
    await page.waitForTimeout(2000);
    const content = await page.content();
    expect(content).toContain("Total");
    expect(content).toContain("Submitted");
    expect(content).toContain("Pending");
  });
});

test.describe("Student Portal: Password", () => {
  test("password page loads", async ({ page }) => {
    await loginStudentBrowser(page);
    await page.goto("/student/password");
    await page.waitForTimeout(1000);
    await expect(page.locator("text=Change Password")).toBeVisible();
  });
});

test.describe("Student Portal: API", () => {
  test("profile API returns data", async ({ request }) => {
    await loginStudentAPI(request);
    const res = await request.get("/api/student/profile");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBeTruthy();
    expect(json.data.name).toBeTruthy();
    expect(json.data.rollNumber).toBeTruthy();
  });

  test("attendance API returns data with monthly breakdown", async ({ request }) => {
    await loginStudentAPI(request);
    const res = await request.get("/api/student/attendance");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBeTruthy();
    expect(json.data.summary).toBeTruthy();
    expect(json.data.monthlyBreakdown).toBeTruthy();
    expect(json.data.streak).toBeTruthy();
  });

  test("grades API returns data with distribution", async ({ request }) => {
    await loginStudentAPI(request);
    const res = await request.get("/api/student/grades");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBeTruthy();
    expect(json.data.summary).toBeTruthy();
    expect(json.data.distribution).toBeTruthy();
    expect(json.data.gradeTrend).toBeTruthy();
  });

  test("assignments API returns data with summary", async ({ request }) => {
    await loginStudentAPI(request);
    const res = await request.get("/api/student/assignments");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBeTruthy();
    expect(json.data.summary).toBeTruthy();
    expect(Array.isArray(json.data.assignments)).toBeTruthy();
  });
});
