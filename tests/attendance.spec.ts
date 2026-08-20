import { test, expect } from "@playwright/test";
import { loginAPI } from "./fixtures";

let counter = 0;
function u() { return `ATT_${Date.now()}_${++counter}`; }
function today() { return new Date().toISOString().split("T")[0]; }

test.describe("Phase 4: Attendance API", () => {
  let classId: string;
  let studentIds: string[];

  test.beforeEach(async ({ page }) => {
    await loginAPI(page.request);
    const classRes = await page.request.get("/api/classes");
    const classes = await classRes.json();
    const cls = classes.find((c: { _count: { students: number } }) => c._count.students > 0);
    classId = cls ? cls.id : classes[0].id;

    const studentRes = await page.request.get(`/api/students?classId=${classId}&pageSize=200`);
    const studentData = await studentRes.json();
    studentIds = studentData.students.map((s: { id: string }) => s.id);
  });

  test("POST /api/attendance/sessions creates a session", async ({ page }) => {
    const dateStr = `2099-06-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`;
    const res = await page.request.post("/api/attendance/sessions", {
      data: { classId, date: dateStr },
    });
    expect(res.status()).toBe(201);
    const data = await res.json();
    expect(data.id).toBeTruthy();
    expect(data.classId).toBe(classId);
  });

  test("POST /api/attendance/sessions rejects duplicate date for same class", async ({ page }) => {
    const dateStr = `2099-07-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`;
    const res1 = await page.request.post("/api/attendance/sessions", {
      data: { classId, date: dateStr },
    });
    expect(res1.status()).toBe(201);

    const res2 = await page.request.post("/api/attendance/sessions", {
      data: { classId, date: dateStr },
    });
    expect(res2.status()).toBe(409);
  });

  test("POST /api/attendance/sessions rejects missing fields", async ({ page }) => {
    const res = await page.request.post("/api/attendance/sessions", { data: {} });
    expect(res.status()).toBe(400);
  });

  test("GET /api/attendance/sessions returns sessions", async ({ page }) => {
    const res = await page.request.get("/api/attendance/sessions");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("GET /api/attendance/sessions?classId filters by class", async ({ page }) => {
    const dateStr = `2099-08-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`;
    await page.request.post("/api/attendance/sessions", {
      data: { classId, date: dateStr },
    });

    const res = await page.request.get(`/api/attendance/sessions?classId=${classId}`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    data.forEach((s: { classId: string }) => expect(s.classId).toBe(classId));
  });

  test("GET /api/attendance/sessions/:id returns session with records", async ({ page }) => {
    const dateStr = `2099-09-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`;
    const createRes = await page.request.post("/api/attendance/sessions", {
      data: { classId, date: dateStr },
    });
    const created = await createRes.json();

    const res = await page.request.get(`/api/attendance/sessions/${created.id}`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.id).toBe(created.id);
    expect(data).toHaveProperty("records");
    expect(Array.isArray(data.records)).toBe(true);
  });

  test("GET /api/attendance/sessions/:id returns 404 for nonexistent", async ({ page }) => {
    const res = await page.request.get("/api/attendance/sessions/nonexistent-id-12345");
    expect(res.status()).toBe(404);
  });

  test("POST /api/attendance/records saves attendance for a session", async ({ page }) => {
    const dateStr = `2099-10-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`;
    const sessionRes = await page.request.post("/api/attendance/sessions", {
      data: { classId, date: dateStr },
    });
    const session = await sessionRes.json();

    const records = studentIds.slice(0, 3).map((sid, i) => ({
      studentId: sid,
      status: i % 2 === 0 ? "PRESENT" : "ABSENT",
    }));

    const res = await page.request.post("/api/attendance/records", {
      data: { sessionId: session.id, records },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.records.length).toBeGreaterThanOrEqual(3);
  });

  test("POST /api/attendance/records rejects missing session", async ({ page }) => {
    const res = await page.request.post("/api/attendance/records", {
      data: {
        sessionId: "nonexistent-id-12345",
        records: [{ studentId: "x", status: "PRESENT" }],
      },
    });
    expect(res.status()).toBe(404);
  });

  test("DELETE /api/attendance/sessions/:id deletes a session", async ({ page }) => {
    const dateStr = `2099-11-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`;
    const createRes = await page.request.post("/api/attendance/sessions", {
      data: { classId, date: dateStr },
    });
    const created = await createRes.json();

    const delRes = await page.request.delete(`/api/attendance/sessions/${created.id}`);
    expect(delRes.status()).toBe(200);
    expect((await delRes.json()).success).toBe(true);

    const getRes = await page.request.get(`/api/attendance/sessions/${created.id}`);
    expect(getRes.status()).toBe(404);
  });

  test("DELETE /api/attendance/sessions/:id returns 404 for nonexistent", async ({ page }) => {
    const res = await page.request.delete("/api/attendance/sessions/nonexistent-id-12345");
    expect(res.status()).toBe(404);
  });

  test("GET /api/attendance/sessions without auth returns 401", async ({ browser }) => {
    const ctx = await browser.newContext();
    const res = await ctx.request.get("http://localhost:3000/api/attendance/sessions");
    expect(res.status()).toBe(401);
    await ctx.close();
  });
});
