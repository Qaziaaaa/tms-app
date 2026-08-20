import { test, expect } from "@playwright/test";
import { loginAPI } from "./fixtures";

test.describe("Phase 15: Edge Cases & Stress", () => {
  test("GET /api/classes with 40+ concurrent requests does not crash", async ({ request }) => {
    await loginAPI(request);
    const promises = Array.from({ length: 40 }, () => request.get("/api/classes"));
    const results = await Promise.all(promises);
    results.forEach(res => expect(res.status()).toBe(200));
  });

  test("POST /api/students rejects extremely long roll number", async ({ request }) => {
    await loginAPI(request);
    const longRoll = "X".repeat(25);
    const classes = await (await request.get("/api/classes")).json();
    const classId = classes[0].id;
    const res = await request.post("/api/students", {
      data: { rollNumber: longRoll, name: "Test", classId },
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/students rejects extremely long name", async ({ request }) => {
    await loginAPI(request);
    const longName = "X".repeat(150);
    const classes = await (await request.get("/api/classes")).json();
    const classId = classes[0].id;
    const res = await request.post("/api/students", {
      data: { rollNumber: `EDGE_${Date.now()}`, name: longName, classId },
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/classes rejects empty string name", async ({ request }) => {
    await loginAPI(request);
    const res = await request.post("/api/classes", {
      data: { name: "", department: "Test", batch: "2026" },
    });
    expect(res.status()).toBe(400);
  });

  test("GET /api/students with very large pageSize clamps to 200", async ({ request }) => {
    await loginAPI(request);
    const res = await request.get("/api/students?pageSize=99999");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.pageSize).toBe(200);
  });

  test("POST /api/attendance/records rejects invalid status", async ({ request }) => {
    await loginAPI(request);
    const classes = await (await request.get("/api/classes")).json();
    const classId = classes[0].id;
    const sessions = await (await request.get(`/api/attendance/sessions?classId=${classId}`)).json();
    if (sessions.length > 0) {
      const students = await (await request.get(`/api/students?classId=${classId}&pageSize=1`)).json();
      if (students.students?.length > 0) {
        const res = await request.post("/api/attendance/records", {
          data: {
            sessionId: sessions[0].id,
            records: [{ studentId: students.students[0].id, status: "INVALID_STATUS" }],
          },
        });
        expect(res.status()).toBe(400);
      }
    }
  });

  test("POST /api/assignments rejects totalMarks of 0", async ({ request }) => {
    await loginAPI(request);
    const classes = await (await request.get("/api/classes")).json();
    const classId = classes[0].id;
    const res = await request.post("/api/assignments", {
      data: { classId, title: "Zero Marks", dueDate: "2099-12-31", totalMarks: 0 },
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/assignments rejects negative totalMarks", async ({ request }) => {
    await loginAPI(request);
    const classes = await (await request.get("/api/classes")).json();
    const classId = classes[0].id;
    const res = await request.post("/api/assignments", {
      data: { classId, title: "Neg Marks", dueDate: "2099-12-31", totalMarks: -5 },
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/students/bulk with 50 students all succeed", async ({ request }) => {
    await loginAPI(request);
    const classes = await (await request.get("/api/classes")).json();
    const classId = classes[0].id;
    const students = Array.from({ length: 50 }, (_, i) => ({
      rollNumber: `STRESS_${Date.now()}_${i}`,
      name: `Stress Student ${i}`,
    }));
    const res = await request.post("/api/students/bulk", {
      data: { classId, students },
    });
    expect(res.status()).toBe(201);
    const data = await res.json();
    expect(data.created).toBe(50);
  });

  test("GET /api/reports with invalid classId returns empty students", async ({ request }) => {
    await loginAPI(request);
    const res = await request.get("/api/reports?classId=nonexistent&type=attendance");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.students.length).toBe(0);
  });

  test("SQL injection attempt in classId param is safe", async ({ request }) => {
    await loginAPI(request);
    const res = await request.get("/api/classes/' OR 1=1--");
    expect(res.status()).toBeLessThan(500);
  });
});
