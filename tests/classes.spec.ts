import { test, expect } from "@playwright/test";
import { loginAPI } from "./fixtures";

test.describe("Phase 2: Classes API", () => {
  test.beforeEach(async ({ page }) => {
    await loginAPI(page.request);
  });

  test("GET /api/classes returns all seeded classes", async ({ page }) => {
    const res = await page.request.get("/api/classes");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(3);

    const names = data.map((c: { name: string }) => c.name);
    expect(names).toContain("Software Engineering");
    expect(names).toContain("Artificial Intelligence");
    expect(names).toContain("International Relations");
  });

  test("GET /api/classes returns student counts", async ({ page }) => {
    const res = await page.request.get("/api/classes");
    const data = await res.json();

    for (const cls of data) {
      expect(cls).toHaveProperty("_count");
      expect(cls._count).toHaveProperty("students");
      expect(typeof cls._count.students).toBe("number");
    }
  });

  test("GET /api/classes includes required fields", async ({ page }) => {
    const res = await page.request.get("/api/classes");
    const data = await res.json();

    for (const cls of data) {
      expect(cls).toHaveProperty("id");
      expect(cls).toHaveProperty("name");
      expect(cls).toHaveProperty("department");
      expect(cls).toHaveProperty("batch");
      expect(cls).toHaveProperty("createdAt");
      expect(typeof cls.id).toBe("string");
      expect(cls.id.length).toBeGreaterThan(0);
    }
  });

  test("POST /api/classes creates a new class", async ({ page }) => {
    const res = await page.request.post("/api/classes", {
      data: { name: "Test Phase2 Class", department: "Testing", batch: "2026" },
    });
    expect(res.status()).toBe(201);
    const data = await res.json();
    expect(data.id).toBeTruthy();
    expect(data.name).toBe("Test Phase2 Class");
    expect(data.department).toBe("Testing");
    expect(data.batch).toBe("2026");
  });

  test("POST /api/classes with optional schedule", async ({ page }) => {
    const res = await page.request.post("/api/classes", {
      data: { name: "Scheduled Class", department: "CS", batch: "2026", schedule: "Mon/Wed 10:00" },
    });
    expect(res.status()).toBe(201);
    const data = await res.json();
    expect(data.schedule).toBe("Mon/Wed 10:00");
  });

  test("POST /api/classes rejects empty name", async ({ page }) => {
    const res = await page.request.post("/api/classes", {
      data: { name: "", department: "CS", batch: "2026" },
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/classes rejects missing department", async ({ page }) => {
    const res = await page.request.post("/api/classes", {
      data: { name: "No Dept", batch: "2026" },
    });
    expect(res.status()).toBe(400);
  });

  test("GET /api/classes/:id returns class with students", async ({ page }) => {
    const listRes = await page.request.get("/api/classes");
    const classes = await listRes.json();
    const classId = classes[0].id;

    const res = await page.request.get(`/api/classes/${classId}`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.id).toBe(classId);
    expect(Array.isArray(data.students)).toBe(true);
  });

  test("GET /api/classes/:id returns 404 for nonexistent class", async ({ page }) => {
    const res = await page.request.get("/api/classes/nonexistent-id-12345");
    expect(res.status()).toBe(404);
    const data = await res.json();
    expect(data.error).toBe("Class not found");
  });

  test("DELETE /api/classes/:id deletes a class", async ({ page }) => {
    const createRes = await page.request.post("/api/classes", {
      data: { name: "To Delete", department: "X", batch: "2026" },
    });
    const created = await createRes.json();

    const delRes = await page.request.delete(`/api/classes/${created.id}`);
    expect(delRes.status()).toBe(200);
    const delData = await delRes.json();
    expect(delData.success).toBe(true);

    const getRes = await page.request.get(`/api/classes/${created.id}`);
    expect(getRes.status()).toBe(404);
  });

  test("DELETE /api/classes/:id returns 404 for nonexistent class", async ({ page }) => {
    const res = await page.request.delete("/api/classes/nonexistent-id-12345");
    expect(res.status()).toBe(404);
  });

  test("PUT /api/classes/:id updates a class", async ({ page }) => {
    const createRes = await page.request.post("/api/classes", {
      data: { name: "To Update", department: "Old", batch: "2025" },
    });
    const created = await createRes.json();

    const putRes = await page.request.put(`/api/classes/${created.id}`, {
      data: { name: "Updated Name", department: "New" },
    });
    expect(putRes.status()).toBe(200);
    const updated = await putRes.json();
    expect(updated.name).toBe("Updated Name");
    expect(updated.department).toBe("New");
    expect(updated.batch).toBe("2025");
  });

  test("PUT /api/classes/:id returns 404 for nonexistent class", async ({ page }) => {
    const res = await page.request.put("/api/classes/nonexistent-id-12345", {
      data: { name: "X" },
    });
    expect(res.status()).toBe(404);
  });

  test("GET /api/classes without auth returns 401", async ({ browser }) => {
    const ctx = await browser.newContext();
    const req = ctx.request;
    const res = await req.get("http://localhost:3000/api/classes");
    expect(res.status()).toBe(401);
    await ctx.close();
  });
});
