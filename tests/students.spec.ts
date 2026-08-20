import { test, expect } from "@playwright/test";
import { loginAPI } from "./fixtures";

let counter = 0;
function u() { return `P3_${Date.now()}_${++counter}`; }

test.describe("Phase 3: Students API", () => {
  let classId: string;

  test.beforeEach(async ({ page }) => {
    await loginAPI(page.request);
    const res = await page.request.get("/api/classes");
    const classes = await res.json();
    const cls = classes.find((c: { _count: { students: number } }) => c._count.students > 0);
    classId = cls ? cls.id : classes[0].id;
  });

  test("GET /api/students?classId returns paginated students", async ({ page }) => {
    const res = await page.request.get(`/api/students?classId=${classId}`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("students");
    expect(data).toHaveProperty("total");
    expect(data).toHaveProperty("page", 1);
    expect(data).toHaveProperty("pageSize", 20);
    expect(Array.isArray(data.students)).toBe(true);
    expect(data.students.length).toBeGreaterThanOrEqual(1);
    expect(data.total).toBeGreaterThanOrEqual(1);
  });

  test("GET /api/students includes class name", async ({ page }) => {
    const res = await page.request.get(`/api/students?classId=${classId}`);
    const data = await res.json();
    const student = data.students[0];
    expect(student).toHaveProperty("class");
    expect(student.class).toHaveProperty("name");
    expect(typeof student.class.name).toBe("string");
  });

  test("GET /api/students respects pagination params", async ({ page }) => {
    const res = await page.request.get(`/api/students?classId=${classId}&page=1&pageSize=2`);
    const data = await res.json();
    expect(data.students.length).toBeLessThanOrEqual(2);
    expect(data.pageSize).toBe(2);
  });

  test("GET /api/students clamps invalid page to 1", async ({ page }) => {
    const res = await page.request.get(`/api/students?classId=${classId}&page=0`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.page).toBe(1);
  });

  test("GET /api/students clamps NaN page to 1", async ({ page }) => {
    const res = await page.request.get(`/api/students?classId=${classId}&page=abc`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.page).toBe(1);
  });

  test("POST /api/students creates a student", async ({ page }) => {
    const id = u();
    const res = await page.request.post("/api/students", {
      data: { rollNumber: id, name: `Student ${id}`, classId },
    });
    expect(res.status()).toBe(201);
    const data = await res.json();
    expect(data.id).toBeTruthy();
    expect(data.rollNumber).toBe(id);
    expect(data.classId).toBe(classId);
  });

  test("POST /api/students rejects missing fields", async ({ page }) => {
    const res = await page.request.post("/api/students", { data: {} });
    expect(res.status()).toBe(400);
  });

  test("GET /api/students/:id returns student with class", async ({ page }) => {
    const id = u();
    const createRes = await page.request.post("/api/students", {
      data: { rollNumber: id, name: `Get ${id}`, classId },
    });
    const created = await createRes.json();

    const res = await page.request.get(`/api/students/${created.id}`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.id).toBe(created.id);
    expect(data).toHaveProperty("class");
  });

  test("GET /api/students/:id returns 404 for nonexistent", async ({ page }) => {
    const res = await page.request.get("/api/students/nonexistent-id-12345");
    expect(res.status()).toBe(404);
  });

  test("PUT /api/students/:id updates a student", async ({ page }) => {
    const id = u();
    const createRes = await page.request.post("/api/students", {
      data: { rollNumber: id, name: `Before ${id}`, classId },
    });
    const created = await createRes.json();

    const putRes = await page.request.put(`/api/students/${created.id}`, {
      data: { name: `After ${id}` },
    });
    expect(putRes.status()).toBe(200);
    const updated = await putRes.json();
    expect(updated.name).toBe(`After ${id}`);
    expect(updated.rollNumber).toBe(id);
  });

  test("PUT /api/students/:id returns 404 for nonexistent", async ({ page }) => {
    const res = await page.request.put("/api/students/nonexistent-id-12345", {
      data: { name: "X" },
    });
    expect(res.status()).toBe(404);
  });

  test("DELETE /api/students/:id deletes a student", async ({ page }) => {
    const id = u();
    const createRes = await page.request.post("/api/students", {
      data: { rollNumber: id, name: `Del ${id}`, classId },
    });
    const created = await createRes.json();

    const delRes = await page.request.delete(`/api/students/${created.id}`);
    expect(delRes.status()).toBe(200);
    expect((await delRes.json()).success).toBe(true);

    const getRes = await page.request.get(`/api/students/${created.id}`);
    expect(getRes.status()).toBe(404);
  });

  test("DELETE /api/students/:id returns 404 for nonexistent", async ({ page }) => {
    const res = await page.request.delete("/api/students/nonexistent-id-12345");
    expect(res.status()).toBe(404);
  });

  test("POST /api/students/bulk imports multiple students", async ({ page }) => {
    const id = u();
    const res = await page.request.post("/api/students/bulk", {
      data: {
        classId,
        students: [
          { rollNumber: `${id}_1`, name: "Bulk One" },
          { rollNumber: `${id}_2`, name: "Bulk Two" },
          { rollNumber: `${id}_3`, name: "Bulk Three" },
        ],
      },
    });
    expect(res.status()).toBe(201);
    const data = await res.json();
    expect(data.created).toBe(3);
  });

  test("POST /api/students/bulk skips duplicates gracefully", async ({ page }) => {
    const id = u();
    const res = await page.request.post("/api/students/bulk", {
      data: {
        classId,
        students: [
          { rollNumber: id, name: "Unique" },
          { rollNumber: id, name: "Duplicate" },
        ],
      },
    });
    expect(res.status()).toBe(201);
    const data = await res.json();
    expect(data.created).toBe(1);
  });

  test("POST /api/students/bulk rejects empty array", async ({ page }) => {
    const res = await page.request.post("/api/students/bulk", {
      data: { classId, students: [] },
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/students/bulk rejects missing classId", async ({ page }) => {
    const res = await page.request.post("/api/students/bulk", {
      data: { students: [{ rollNumber: "X", name: "X" }] },
    });
    expect(res.status()).toBe(400);
  });

  test("GET /api/students without auth returns 401", async ({ browser }) => {
    const ctx = await browser.newContext();
    const res = await ctx.request.get("http://localhost:3000/api/students");
    expect(res.status()).toBe(401);
    await ctx.close();
  });
});
