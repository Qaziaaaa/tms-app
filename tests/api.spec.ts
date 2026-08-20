import { test, expect } from "@playwright/test";
import { loginAPI } from "./fixtures";

test.describe("Phase 14: Integration Tests", () => {
  test.beforeEach(async ({ page }) => {
    await loginAPI(page.request);
  });

  test("full CRUD lifecycle across all entities", async ({ page }) => {
    let classId: string;

    const classRes = await page.request.post("/api/classes", {
      data: { name: "Lifecycle Test", department: "Test Dept", batch: "2026" },
    });
    expect(classRes.status()).toBe(201);
    const cls = await classRes.json();
    classId = cls.id;

    const studentRes = await page.request.post("/api/students", {
      data: { rollNumber: `LIFE_${Date.now()}`, name: "Lifecycle Student", classId },
    });
    expect(studentRes.status()).toBe(201);
    const student = await studentRes.json();

    const dateStr = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
    const sessionRes = await page.request.post("/api/attendance/sessions", {
      data: { classId, date: dateStr },
    });
    expect(sessionRes.status()).toBe(201);
    const session = await sessionRes.json();

    const recordRes = await page.request.post("/api/attendance/records", {
      data: { sessionId: session.id, records: [{ studentId: student.id, status: "PRESENT" }] },
    });
    expect(recordRes.status()).toBe(200);

    const sessionDetail = await page.request.get(`/api/attendance/sessions/${session.id}`);
    const sessionData = await sessionDetail.json();
    expect(sessionData.records.length).toBeGreaterThanOrEqual(1);
    expect(sessionData.records[0].status).toBe("PRESENT");

    const dueDate = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    const assignRes = await page.request.post("/api/assignments", {
      data: { title: "Lifecycle Assignment", classId, dueDate, totalMarks: 100 },
    });
    expect(assignRes.status()).toBe(201);
    const assignment = await assignRes.json();

    const subRes = await page.request.post(`/api/assignments/${assignment.id}/submissions`, {
      data: { submissions: [{ studentId: student.id, status: "SUBMITTED", marks: 90 }] },
    });
    expect(subRes.status()).toBe(200);

    const assignDetail = await page.request.get(`/api/assignments/${assignment.id}`);
    const assignData = await assignDetail.json();
    const sub = assignData.submissions.find((s: { studentId: string }) => s.studentId === student.id);
    expect(sub.marks).toBe(90);

    const reportsAtt = await page.request.get(`/api/reports?type=attendance&classId=${classId}`);
    expect(reportsAtt.status()).toBe(200);

    const reportsSub = await page.request.get(`/api/reports?type=submissions&classId=${classId}`);
    expect(reportsSub.status()).toBe(200);

    const dashboard = await page.request.get("/api/dashboard");
    expect(dashboard.status()).toBe(200);

    await page.request.delete(`/api/attendance/sessions/${session.id}`);
    await page.request.delete(`/api/assignments/${assignment.id}`);
    await page.request.delete(`/api/students/${student.id}`);
    await page.request.delete(`/api/classes/${classId}`);

    const getDeleted = await page.request.get(`/api/classes/${classId}`);
    expect(getDeleted.status()).toBe(404);
  });
});
