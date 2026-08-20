import { type Page, type APIRequestContext } from "@playwright/test";

const TEACHER_EMAIL = "teacher@tms.edu";
const TEACHER_PASSWORD = "password123";

export async function loginAPI(request: APIRequestContext) {
  const csrfRes = await request.get("/api/auth/csrf");
  const { csrfToken } = await csrfRes.json();
  await request.post("/api/auth/callback/credentials", {
    form: { csrfToken, email: TEACHER_EMAIL, password: TEACHER_PASSWORD },
  });
}

export async function loginBrowser(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(TEACHER_EMAIL);
  await page.getByLabel("Password").fill(TEACHER_PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
}
