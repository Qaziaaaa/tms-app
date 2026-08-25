import { test, expect } from "@playwright/test";
import { loginTeacherAPI } from "./fixtures";

async function getSeClassId(request: import("@playwright/test").APIRequestContext): Promise<string> {
  const classesRes = await request.get("/api/classes");
  const classesJson = await classesRes.json();
  return classesJson.data.find((c: { name: string }) => c.name === "Software Engineering").id;
}

test.describe("Teacher: Bulk Student Import", () => {
  test("can bulk import students via API", async ({ request }) => {
    await loginTeacherAPI(request);
    const classId = await getSeClassId(request);

    const res = await request.post("/api/students/bulk", {
      data: {
        classId,
        students: Array.from({ length: 50 }, (_, i) => ({
          name: `Bulk Student ${i + 1}`,
          rollNumber: `BULK-SE-${String(i + 1).padStart(3, "0")}`,
        })),
      },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBeTruthy();
    expect(json.data.created).toBeGreaterThan(0);
  });

  test("students page shows student list", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("teacher@tms.edu");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    await page.goto("/students");
    await expect(page.getByRole("heading", { name: "Students" })).toBeVisible({ timeout: 15000 });
  });

  test("single student can be added via API", async ({ request }) => {
    await loginTeacherAPI(request);
    const classId = await getSeClassId(request);

    const res = await request.post("/api/students", {
      data: {
        name: "Single Test Student",
        rollNumber: "SINGLE-001",
        classId,
      },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBeTruthy();
  });
});
