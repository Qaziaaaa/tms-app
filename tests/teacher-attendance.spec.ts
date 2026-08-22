import { test, expect } from "@playwright/test";
import { loginTeacherAPI } from "./fixtures";

test.describe("Teacher: Attendance Management", () => {
  test("can get attendance sessions via API", async ({ request }) => {
    await loginTeacherAPI(request);
    const res = await request.get("/api/attendance/sessions");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBeTruthy();
  });

  test("can create attendance session via API", async ({ request }) => {
    await loginTeacherAPI(request);

    const classesRes = await request.get("/api/classes");
    const classesJson = await classesRes.json();
    const classId = classesJson.data[0].id;

    const res = await request.post("/api/attendance/sessions", {
      data: {
        classId,
        date: new Date().toISOString(),
      },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBeTruthy();
    expect(json.data._id || json.data.id).toBeTruthy();
  });

  test("can mark attendance for students via API", async ({ request }) => {
    await loginTeacherAPI(request);

    const classesRes = await request.get("/api/classes");
    const classesJson = await classesRes.json();
    const classId = classesJson.data[0].id;

    const sessionRes = await request.post("/api/attendance/sessions", {
      data: { classId, date: new Date().toISOString() },
    });
    const sessionJson = await sessionRes.json();
    const sessionId = sessionJson.data._id || sessionJson.data.id;

    const studentsRes = await request.get(`/api/students?classId=${classId}`);
    const studentsJson = await studentsRes.json();
    const students = studentsJson.data?.students || studentsJson.data || [];

    const attendanceData = students.slice(0, 10).map((s: { id: string }, i: number) => ({
      studentId: s.id,
      status: i < 7 ? "PRESENT" : "ABSENT",
    }));

    const markRes = await request.post("/api/attendance/records", {
      data: { sessionId, records: attendanceData },
    });
    expect(markRes.ok()).toBeTruthy();
    const markJson = await markRes.json();
    expect(markJson.success).toBeTruthy();
  });

  test("attendance page loads in browser", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("teacher@tms.edu");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    await page.goto("/attendance");
    await page.waitForTimeout(2000);
    await expect(page.locator("text=Attendance")).toBeVisible();
  });
});
