import { test, expect } from "@playwright/test";
import { loginTeacherAPI } from "./fixtures";

test.describe("Teacher: Bulk Student Import", () => {
  test("can bulk import students via API", async ({ request }) => {
    await loginTeacherAPI(request);

    const res = await request.post("/api/students/bulk", {
      data: {
        className: "Software Engineering",
        students: Array.from({ length: 50 }, (_, i) => ({
          name: `Bulk Student ${i + 1}`,
          rollNumber: `BULK-SE-${String(i + 1).padStart(3, "0")}`,
          email: `bulk.student${i + 1}@test.edu`,
        })),
      },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBeTruthy();
  });

  test("students page shows student list", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("teacher@tms.edu");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    await page.goto("/students");
    await page.waitForTimeout(2000);
    const content = await page.content();
    expect(content).toContain("Students");
  });

  test("single student can be added via API", async ({ request }) => {
    await loginTeacherAPI(request);

    const res = await request.post("/api/students", {
      data: {
        name: "Single Test Student",
        rollNumber: "SINGLE-001",
        email: "single.test@student.edu",
        className: "Software Engineering",
      },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBeTruthy();
  });
});
