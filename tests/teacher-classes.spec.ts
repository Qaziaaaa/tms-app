import { test, expect } from "@playwright/test";
import { loginTeacherBrowser } from "./fixtures";

test.describe("Teacher: Class Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginTeacherBrowser(page);
  });

  test("dashboard shows class cards", async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText("Active Classes")).toBeVisible({ timeout: 15000 });
    const cards = page.locator("[class*='rounded-lg'][class*='border']");
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("can navigate to classes page", async ({ page }) => {
    await page.goto("/classes");
    await expect(page.getByRole("heading", { name: "Classes" })).toBeVisible({ timeout: 15000 });
  });

  test("classes page shows seeded classes", async ({ page }) => {
    await page.goto("/classes");
    await page.waitForTimeout(2000);
    const content = await page.content();
    expect(content).toContain("Software Engineering");
    expect(content).toContain("Artificial Intelligence");
  });

  test("can create a new class via API", async ({ request }) => {
    const csrfRes = await request.get("/api/auth/csrf");
    const { csrfToken } = await csrfRes.json();
    await request.post("/api/auth/callback/credentials", {
      form: { csrfToken, email: "teacher@tms.edu", password: "password123" },
    });

    const res = await request.post("/api/classes", {
      data: {
        name: "Test Class E2E",
        department: "Testing",
        batch: "2026",
        schedule: "Friday 3:00 PM",
      },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBeTruthy();
    expect(json.data.name).toBe("Test Class E2E");
  });
});
