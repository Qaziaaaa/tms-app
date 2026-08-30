import { test, expect } from "@playwright/test";
import { loginTeacherAPI, loginStudentAPI, ensureTeacherSession } from "./fixtures";

test.describe("Integration: Teacher -> Student Data Flow", () => {
  test("full flow: teacher creates class, adds students, marks attendance, assigns work; student sees it all", async ({ request }) => {
    await loginTeacherAPI(request);

    // Step 1: Create a class
    const classRes = await request.post("/api/classes", {
      data: {
        name: "Integration Test Class",
        department: "Testing",
        batch: "2026",
        schedule: "Thursday 11:00 AM",
      },
    });
    expect(classRes.ok()).toBeTruthy();
    const classJson = await classRes.json();
    const classId = classJson.data.id;

    // Step 2: Bulk add 50 students
    const bulkRes = await request.post("/api/students/bulk", {
      data: {
        classId,
        students: Array.from({ length: 50 }, (_, i) => ({
          name: `Integration Student ${i + 1}`,
          rollNumber: `INT-26-${String(i + 1).padStart(3, "0")}`,
        })),
      },
    });
    expect(bulkRes.ok()).toBeTruthy();

    // Step 3: Create attendance session
    const sessionId = await ensureTeacherSession(request, classId);
    expect(sessionId).toBeTruthy();

    // Step 4: Get students and mark attendance
    const studentsRes = await request.get(`/api/students?classId=${classId}&pageSize=200`);
    const studentsJson = await studentsRes.json();
    const students = studentsJson.data?.students || studentsJson.data || [];
    expect(students.length).toBeGreaterThanOrEqual(50);

    const attendanceRecords = students.slice(0, 20).map((s: { id: string }, i: number) => ({
      studentId: s.id,
      status: i < 15 ? "PRESENT" : "ABSENT",
    }));

    const markRes = await request.post("/api/attendance/records", {
      data: { sessionId, records: attendanceRecords },
    });
    expect(markRes.ok()).toBeTruthy();

    // Step 5: Create assignment
    const assignmentRes = await request.post("/api/assignments", {
      data: {
        classId,
        title: "Integration Test Assignment",
        description: "Complete the integration test exercise",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        totalMarks: 100,
      },
    });
    expect(assignmentRes.ok()).toBeTruthy();
    const assignmentJson = await assignmentRes.json();
    const assignmentId = assignmentJson.data.id;

    // Step 6: Submit assignment for first student
    const submitRes = await request.post(`/api/assignments/${assignmentId}/submissions`, {
      data: {
        submissions: [
          {
            studentId: students[0].id,
            marks: 92,
            status: "SUBMITTED",
          },
        ],
      },
    });
    expect(submitRes.ok()).toBeTruthy();

    // Step 7: Switch to student view - verify profile
    await loginStudentAPI(request);
    const profileRes = await request.get("/api/student/profile");
    expect(profileRes.ok()).toBeTruthy();
    const profileJson = await profileRes.json();
    expect(profileJson.data.name).toBeTruthy();

    // Step 8: Student sees attendance data
    const studentAttRes = await request.get("/api/student/attendance");
    expect(studentAttRes.ok()).toBeTruthy();
    const studentAttJson = await studentAttRes.json();
    expect(studentAttJson.data.summary).toBeTruthy();
    expect(studentAttJson.data.monthlyBreakdown).toBeTruthy();
    expect(studentAttJson.data.streak).toBeTruthy();

    // Step 9: Student sees grades
    const gradesRes = await request.get("/api/student/grades");
    expect(gradesRes.ok()).toBeTruthy();
    const gradesJson = await gradesRes.json();
    expect(gradesJson.data.summary).toBeTruthy();
    expect(gradesJson.data.distribution).toBeTruthy();

    // Step 10: Student sees assignments
    const assignsRes = await request.get("/api/student/assignments");
    expect(assignsRes.ok()).toBeTruthy();
    const assignsJson = await assignsRes.json();
    expect(assignsJson.data.summary).toBeTruthy();
  });

  test("student attendance reflects teacher marking", async ({ request }) => {
    await loginTeacherAPI(request);

    const classesRes = await request.get("/api/classes");
    const classesJson = await classesRes.json();
    const seClass = classesJson.data.find((c: { name: string }) => c.name === "Software Engineering");
    expect(seClass).toBeTruthy();
    const classId = seClass.id;

    const studentsRes = await request.get(`/api/students?classId=${classId}`);
    const studentsJson = await studentsRes.json();
    const students = studentsJson.data?.students || studentsJson.data || [];
    const targetStudent = students.find((s: { email: string }) => s.email === "ahmedse01@uop.edu") || students[0];

    const sessionId = await ensureTeacherSession(request, classId);
    expect(sessionId).toBeTruthy();

    const markRes = await request.post("/api/attendance/records", {
      data: {
        sessionId,
        records: [{ studentId: targetStudent.id, status: "PRESENT" }],
      },
    });
    expect(markRes.ok()).toBeTruthy();

    await loginStudentAPI(request);
    const attRes = await request.get("/api/student/attendance");
    const attJson = await attRes.json();
    expect(attJson.data.summary.present).toBeGreaterThanOrEqual(1);
  });

  test("dashboard API returns aggregated data", async ({ request }) => {
    await loginTeacherAPI(request);
    const res = await request.get("/api/dashboard");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBeTruthy();
    expect(json.data).toBeTruthy();
  });

  test("reports API returns data", async ({ request }) => {
    await loginTeacherAPI(request);
    const classesRes = await request.get("/api/classes");
    const classesJson = await classesRes.json();
    const classId = classesJson.data[0].id;
    const res = await request.get(`/api/reports?classId=${classId}&type=attendance`);
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBeTruthy();
  });
});
