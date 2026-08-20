import { test, expect } from "@playwright/test";
import { loginAPI } from "./fixtures";

test.describe("Phase 6: Reports + Dashboard + AI API", () => {
  let classId: string;

  test.beforeEach(async ({ page }) => {
    await loginAPI(page.request);
    const res = await page.request.get("/api/classes");
    const classes = await res.json();
    const cls = classes.find((c: { _count: { students: number } }) => c._count.students > 0);
    classId = cls ? cls.id : classes[0].id;
  });

  test("GET /api/reports requires classId", async ({ page }) => {
    const res = await page.request.get("/api/reports?type=attendance");
    expect(res.status()).toBe(400);
  });

  test("GET /api/reports requires type param", async ({ page }) => {
    const res = await page.request.get(`/api/reports?classId=${classId}`);
    expect(res.status()).toBe(400);
  });

  test("GET /api/reports rejects invalid type", async ({ page }) => {
    const res = await page.request.get(`/api/reports?classId=${classId}&type=invalid`);
    expect(res.status()).toBe(400);
  });

  test("GET /api/reports?classId&type=attendance returns attendance data", async ({ page }) => {
    const res = await page.request.get(`/api/reports?classId=${classId}&type=attendance`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.type).toBe("attendance");
    expect(data.classId).toBe(classId);
    expect(data).toHaveProperty("totalSessions");
    expect(Array.isArray(data.students)).toBe(true);
    expect(data.students.length).toBeGreaterThanOrEqual(1);

    const student = data.students[0];
    expect(student).toHaveProperty("id");
    expect(student).toHaveProperty("rollNumber");
    expect(student).toHaveProperty("name");
    expect(student).toHaveProperty("presentCount");
    expect(student).toHaveProperty("attendancePercentage");
  });

  test("GET /api/reports?classId&type=submissions returns submission data", async ({ page }) => {
    const res = await page.request.get(`/api/reports?classId=${classId}&type=submissions`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.type).toBe("submissions");
    expect(data.classId).toBe(classId);
    expect(data).toHaveProperty("totalAssignments");
    expect(Array.isArray(data.students)).toBe(true);
    expect(data.students.length).toBeGreaterThanOrEqual(1);

    const student = data.students[0];
    expect(student).toHaveProperty("id");
    expect(student).toHaveProperty("submittedCount");
    expect(student).toHaveProperty("averageMarks");
  });

  test("GET /api/dashboard returns summary data", async ({ page }) => {
    const res = await page.request.get("/api/dashboard");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(typeof data.totalClasses).toBe("number");
    expect(typeof data.totalStudents).toBe("number");
    expect(typeof data.totalSessions).toBe("number");
    expect(typeof data.totalAssignments).toBe("number");
    expect(Array.isArray(data.recentAttendance)).toBe(true);
    expect(Array.isArray(data.classesWithStats)).toBe(true);
  });

  test("GET /api/dashboard classesWithStats includes required fields", async ({ page }) => {
    const res = await page.request.get("/api/dashboard");
    const data = await res.json();
    expect(data.classesWithStats.length).toBeGreaterThanOrEqual(1);
    const cls = data.classesWithStats[0];
    expect(cls).toHaveProperty("id");
    expect(cls).toHaveProperty("name");
    expect(cls).toHaveProperty("studentCount");
    expect(cls).toHaveProperty("sessionCount");
    expect(cls).toHaveProperty("averageAttendance");
  });

  test("GET /api/ai requires classId", async ({ page }) => {
    const res = await page.request.get("/api/ai");
    expect(res.status()).toBe(400);
  });

  test("GET /api/ai returns insights for a class", async ({ page }) => {
    const res = await page.request.get(`/api/ai?classId=${classId}`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("classId", classId);
    expect(data).toHaveProperty("className");
    expect(data).toHaveProperty("totalStudents");
    expect(data).toHaveProperty("averageAttendance");
    expect(data).toHaveProperty("averageSubmissionRate");
    expect(data).toHaveProperty("students");
    expect(Array.isArray(data.students)).toBe(true);
    expect(data.students.length).toBeGreaterThanOrEqual(1);

    const student = data.students[0];
    expect(student).toHaveProperty("riskLevel");
    expect(["low", "medium", "high"]).toContain(student.riskLevel);
  });

  test("GET /api/ai returns 500 for nonexistent classId", async ({ page }) => {
    const res = await page.request.get("/api/ai?classId=nonexistent-id-12345");
    expect(res.status()).toBe(500);
  });

  test("GET /api/dashboard without auth returns 401", async ({ browser }) => {
    const ctx = await browser.newContext();
    const res = await ctx.request.get("http://localhost:3000/api/dashboard");
    expect(res.status()).toBe(401);
    await ctx.close();
  });
});
