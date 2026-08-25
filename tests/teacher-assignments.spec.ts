import { test, expect } from "@playwright/test";
import { loginTeacherAPI } from "./fixtures";

test.describe("Teacher: Assignment Management", () => {
  test("can create assignment via API", async ({ request }) => {
    await loginTeacherAPI(request);

    const classesRes = await request.get("/api/classes");
    const classesJson = await classesRes.json();
    const classId = classesJson.data[0].id;

    const res = await request.post("/api/assignments", {
      data: {
        classId,
        title: "E2E Test Assignment",
        description: "This is a test assignment created by E2E tests",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        totalMarks: 100,
      },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBeTruthy();
    expect(json.data.title).toBe("E2E Test Assignment");
  });

  test("can create multiple assignments", async ({ request }) => {
    await loginTeacherAPI(request);

    const classesRes = await request.get("/api/classes");
    const classesJson = await classesRes.json();
    const classId = classesJson.data[0].id;

    for (let i = 1; i <= 3; i++) {
      const res = await request.post("/api/assignments", {
        data: {
          classId,
          title: `Assignment ${i}`,
          description: `Description for assignment ${i}`,
          dueDate: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000).toISOString(),
          totalMarks: 50 + i * 10,
        },
      });
      expect(res.ok()).toBeTruthy();
    }
  });

  test("assignments page loads in browser", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("teacher@tms.edu");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    await page.goto("/assignments");
    await expect(page.getByRole("heading", { name: "Assignments" })).toBeVisible({ timeout: 15000 });
  });

  test("can grade a submission via API", async ({ request }) => {
    await loginTeacherAPI(request);


    const classesRes = await request.get("/api/classes");
    const classesJson = await classesRes.json();
    const classId = classesJson.data[classesJson.data.length - 1].id;

    const assignmentsRes = await request.get(`/api/assignments?classId=${classId}`);
    const assignmentsJson = await assignmentsRes.json();
    const assignment = assignmentsJson.data?.assignments?.[0] || assignmentsJson.data?.[0];
    if (!assignment) return;

    const studentsRes = await request.get(`/api/students?classId=${classId}`);
    const studentsJson = await studentsRes.json();
    const students = studentsJson.data?.students || studentsJson.data || [];
    if (students.length === 0) return;

    const submissionRes = await request.post(`/api/assignments/${assignment.id}/submissions`, {
      data: {
        submissions: [
          {
            studentId: students[0].id,
            marks: 85,
            status: "SUBMITTED",
          },
        ],
      },
    });
    expect(submissionRes.ok()).toBeTruthy();
  });
});
