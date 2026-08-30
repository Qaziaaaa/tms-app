import { type Page, type APIRequestContext } from "@playwright/test";

const TEACHER_EMAIL = "teacher@tms.edu";
const TEACHER_PASSWORD = "password123";

const STUDENT_EMAIL = "ahmedse01@uop.edu";
const STUDENT_ROLL = "SE-2024-01";
let studentPassword = "student123";

export async function loginTeacherAPI(request: APIRequestContext) {
  const csrfRes = await request.get("/api/auth/csrf");
  const { csrfToken } = await csrfRes.json();
  await request.post("/api/auth/callback/credentials", {
    form: {
      csrfToken,
      identifier: TEACHER_EMAIL,
      portal: "teacher",
      password: TEACHER_PASSWORD,
    },
  });
}

export async function loginStudentAPI(request: APIRequestContext) {
  const csrfRes = await request.get("/api/auth/csrf");
  const { csrfToken } = await csrfRes.json();
  await request.post("/api/auth/callback/credentials", {
    form: {
      csrfToken,
      identifier: STUDENT_EMAIL,
      portal: "student",
      password: studentPassword,
    },
  });
}

export async function loginTeacherBrowser(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(TEACHER_EMAIL);
  await page.getByLabel("Password").fill(TEACHER_PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
}

export async function loginStudentBrowser(page: Page) {
  await page.goto("/login");
  await page.getByRole("tab", { name: "Student" }).click();
  await page.getByLabel("Email or Roll Number").fill(STUDENT_EMAIL);
  await page.getByLabel("Password").fill(studentPassword);
  await page.getByRole("button", { name: "Sign In" }).click();

  // Wait for navigation to complete (either password or dashboard)
  await page.waitForURL(/\/student\/(password|dashboard)/, { timeout: 15000 });

  if (page.url().includes("/student/password")) {
    const pwInputs = page.locator('input[type="password"]');
    await pwInputs.nth(0).fill(studentPassword);
    await pwInputs.nth(1).fill("NewPass123!");
    await pwInputs.nth(2).fill("NewPass123!");
    await page.getByRole("button", { name: "Change Password" }).click();
    await page.waitForURL(/\/login/, { timeout: 10000 });
    studentPassword = "NewPass123!";

    await page.goto("/login");
    await page.getByRole("tab", { name: "Student" }).click();
    await page.getByLabel("Email or Roll Number").fill(STUDENT_EMAIL);
    await page.getByLabel("Password").fill(studentPassword);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(/\/student\/dashboard/, { timeout: 15000 });
  }
}

export const TEACHER = { email: TEACHER_EMAIL, password: TEACHER_PASSWORD };
export const STUDENT = { email: STUDENT_EMAIL, password: studentPassword, roll: STUDENT_ROLL };

function localTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function ensureTeacherSession(request: APIRequestContext, classId: string): Promise<string | null> {
  const createRes = await request.post("/api/attendance/sessions", {
    data: { classId, dateKey: localTodayKey() },
  });
  const created = await createRes.json();
  if (created.success && created.data?.id) return created.data.id as string;

  const listRes = await request.get(`/api/attendance/sessions?classId=${classId}`);
  const listed = await listRes.json();
  const todayKey = localTodayKey();
  const existing = (listed.data || []).find((s: { dateKey: string }) => s.dateKey === todayKey);
  return existing?.id ?? null;
}
