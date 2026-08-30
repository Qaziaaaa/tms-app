import { test, expect } from "@playwright/test";
import { loginStudentAPI, loginStudentBrowser, loginTeacherAPI } from "../fixtures";

type Assignment = { id: string; title: string; submission?: { status: string } | null };

async function createAssignment(request: Parameters<typeof loginTeacherAPI>[0], classId: string, title: string) {
  const response = await request.post("/api/assignments", {
    data: {
      classId,
      title,
      description: "Assignment-flow regression coverage",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      totalMarks: 20,
    },
  });
  expect(response.ok()).toBeTruthy();
  return (await response.json()).data as { id: string };
}

test.describe("Assignment submission and review flow", () => {
  test("student sees a validation toast when no work is attached", async ({ page, request }) => {
    await loginStudentAPI(request);
    const profile = (await (await request.get("/api/student/profile")).json()).data;

    await loginTeacherAPI(request);
    const title = `Assignment Flow Validation ${Date.now()}`;
    await createAssignment(request, String(profile.class.id ?? profile.class._id), title);

    await loginStudentBrowser(page);
    await page.goto("/student/assignments");
    const assignmentRow = page.locator("div.p-2", { has: page.getByText(title, { exact: true }) });
    await assignmentRow.getByRole("button", { name: "Turn in", exact: true }).click();
    await assignmentRow.getByRole("button", { name: "Turn in", exact: true }).click();
    await expect(page.getByText("Add a URL link or a note before turning in.", { exact: true })).toBeVisible();
  });

  test("student turn-in, teacher review, rejection, and withdrawal follow the status guards", async ({ request }) => {
    await loginStudentAPI(request);
    const profile = (await (await request.get("/api/student/profile")).json()).data;
    const classId = String(profile.class.id ?? profile.class._id);
    const studentId = String(profile.id);

    await loginTeacherAPI(request);
    const timestamp = Date.now();
    const accepted = await createAssignment(request, classId, `Assignment Flow Accept ${timestamp}`);

    await loginStudentAPI(request);
    const invalidTurnIn = await request.post(`/api/student/assignments/${accepted.id}`, { data: {} });
    expect(invalidTurnIn.status()).toBe(400);
    expect((await invalidTurnIn.json()).errors).toContain("Add a URL link or a note before turning in.");

    const turnIn = await request.post(`/api/student/assignments/${accepted.id}`, {
      data: { submissionLink: "https://example.com/assignment-flow", submissionNote: "Please review this work." },
    });
    expect(turnIn.ok()).toBeTruthy();
    expect((await turnIn.json()).data.status).toBe("TURNED_IN");

    await loginTeacherAPI(request);
    const awaitingDetail = await request.get(`/api/assignments/${accepted.id}`);
    const awaitingSubmission = (await awaitingDetail.json()).data.submissions.find(
      (submission: { studentId: string }) => submission.studentId === studentId
    );
    expect(awaitingSubmission).toMatchObject({
      status: "TURNED_IN",
      submissionLink: "https://example.com/assignment-flow",
      submissionNote: "Please review this work.",
    });

    const acceptedReview = await request.patch(`/api/assignments/${accepted.id}/submissions/${studentId}`, {
      data: { action: "accept", marks: 18 },
    });
    expect(acceptedReview.ok()).toBeTruthy();

    await loginStudentAPI(request);
    const afterAccept = (await (await request.get("/api/student/assignments")).json()).data.assignments as Assignment[];
    expect(afterAccept.find((assignment) => assignment.id === accepted.id)?.submission).toMatchObject({ status: "SUBMITTED" });

    const blockedWithdrawal = await request.delete(`/api/student/assignments/${accepted.id}`);
    expect(blockedWithdrawal.status()).toBe(409);

    await loginTeacherAPI(request);
    const rejected = await createAssignment(request, classId, `Assignment Flow Reject ${timestamp}`);

    await loginStudentAPI(request);
    expect((await request.post(`/api/student/assignments/${rejected.id}`, {
      data: { submissionNote: "This submission will be returned." },
    })).ok()).toBeTruthy();

    await loginTeacherAPI(request);
    const rejectedReview = await request.patch(`/api/assignments/${rejected.id}/submissions/${studentId}`, {
      data: { action: "reject" },
    });
    expect(rejectedReview.ok()).toBeTruthy();

    await loginStudentAPI(request);
    const afterReject = (await (await request.get("/api/student/assignments")).json()).data.assignments as Assignment[];
    expect(afterReject.find((assignment) => assignment.id === rejected.id)?.submission).toBeNull();

    expect((await request.post(`/api/student/assignments/${rejected.id}`, {
      data: { submissionNote: "Submitting again before withdrawing." },
    })).ok()).toBeTruthy();
    const withdrawn = await request.delete(`/api/student/assignments/${rejected.id}`);
    expect(withdrawn.ok()).toBeTruthy();
    expect((await withdrawn.json()).data.status).toBe("NOT_SUBMITTED");
  });
});
