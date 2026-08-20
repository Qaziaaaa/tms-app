import { test, expect } from "@playwright/test";
import { loginAPI } from "./fixtures";

let counter = 0;
function u() { return `ASSIGN_${Date.now()}_${++counter}`; }

test.describe("Phase 5: Assignments API", () => {
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

  test("POST /api/assignments creates an assignment with NOT_SUBMITTED submissions", async ({ page }) => {
    const title = u();
    const dueDate = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    const res = await page.request.post("/api/assignments", {
      data: { classId, title, dueDate, totalMarks: 100 },
    });
    expect(res.status()).toBe(201);
    const data = await res.json();
    expect(data.id).toBeTruthy();
    expect(data.title).toBe(title);
    expect(data.totalMarks).toBe(100);
    expect(Array.isArray(data.submissions)).toBe(true);
    expect(data.submissions.length).toBeGreaterThanOrEqual(1);
    data.submissions.forEach((s: { status: string }) => expect(s.status).toBe("NOT_SUBMITTED"));
  });

  test("POST /api/assignments rejects missing fields", async ({ page }) => {
    const res = await page.request.post("/api/assignments", { data: {} });
    expect(res.status()).toBe(400);
  });

  test("GET /api/assignments returns assignments", async ({ page }) => {
    const res = await page.request.get("/api/assignments");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("GET /api/assignments?classId filters by class", async ({ page }) => {
    const title = u();
    const dueDate = new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0];
    await page.request.post("/api/assignments", {
      data: { classId, title, dueDate, totalMarks: 50 },
    });

    const res = await page.request.get(`/api/assignments?classId=${classId}`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    data.forEach((a: { classId: string }) => expect(a.classId).toBe(classId));
  });

  test("GET /api/assignments/:id returns assignment with submissions", async ({ page }) => {
    const title = u();
    const dueDate = new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0];
    const createRes = await page.request.post("/api/assignments", {
      data: { classId, title, dueDate, totalMarks: 25 },
    });
    const created = await createRes.json();

    const res = await page.request.get(`/api/assignments/${created.id}`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.id).toBe(created.id);
    expect(data).toHaveProperty("submissions");
  });

  test("GET /api/assignments/:id returns 404 for nonexistent", async ({ page }) => {
    const res = await page.request.get("/api/assignments/nonexistent-id-12345");
    expect(res.status()).toBe(404);
  });

  test("PUT /api/assignments/:id updates an assignment", async ({ page }) => {
    const title = u();
    const dueDate = new Date(Date.now() + 10 * 86400000).toISOString().split("T")[0];
    const createRes = await page.request.post("/api/assignments", {
      data: { classId, title, dueDate, totalMarks: 50 },
    });
    const created = await createRes.json();

    const newTitle = u();
    const putRes = await page.request.put(`/api/assignments/${created.id}`, {
      data: { title: newTitle },
    });
    expect(putRes.status()).toBe(200);
    const updated = await putRes.json();
    expect(updated.title).toBe(newTitle);
  });

  test("PUT /api/assignments/:id returns 404 for nonexistent", async ({ page }) => {
    const res = await page.request.put("/api/assignments/nonexistent-id-12345", {
      data: { title: "X" },
    });
    expect(res.status()).toBe(404);
  });

  test("POST /api/assignments/:id/submissions saves submission statuses", async ({ page }) => {
    const title = u();
    const dueDate = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];
    const createRes = await page.request.post("/api/assignments", {
      data: { classId, title, dueDate, totalMarks: 100 },
    });
    const created = await createRes.json();

    const subs = studentIds.slice(0, 3).map((sid, i) => ({
      studentId: sid,
      status: i === 0 ? "SUBMITTED" : i === 1 ? "LATE" : "NOT_SUBMITTED",
      marks: i === 0 ? 85 : undefined,
    }));

    const res = await page.request.post(`/api/assignments/${created.id}/submissions`, {
      data: { submissions: subs },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.submissions.length).toBeGreaterThanOrEqual(3);
  });

  test("DELETE /api/assignments/:id deletes an assignment", async ({ page }) => {
    const title = u();
    const dueDate = new Date(Date.now() + 20 * 86400000).toISOString().split("T")[0];
    const createRes = await page.request.post("/api/assignments", {
      data: { classId, title, dueDate, totalMarks: 10 },
    });
    const created = await createRes.json();

    const delRes = await page.request.delete(`/api/assignments/${created.id}`);
    expect(delRes.status()).toBe(200);
    expect((await delRes.json()).success).toBe(true);

    const getRes = await page.request.get(`/api/assignments/${created.id}`);
    expect(getRes.status()).toBe(404);
  });

  test("DELETE /api/assignments/:id returns 404 for nonexistent", async ({ page }) => {
    const res = await page.request.delete("/api/assignments/nonexistent-id-12345");
    expect(res.status()).toBe(404);
  });

  test("GET /api/assignments without auth returns 401", async ({ browser }) => {
    const ctx = await browser.newContext();
    const res = await ctx.request.get("http://localhost:3000/api/assignments");
    expect(res.status()).toBe(401);
    await ctx.close();
  });
});
