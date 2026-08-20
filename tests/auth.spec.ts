import { test, expect } from "@playwright/test";

const TEACHER_EMAIL = "teacher@tms.edu";
const TEACHER_PASSWORD = "password123";

test.describe("Phase 1a: Auth Route — CSRF", () => {
  test("GET /api/auth/csrf returns a CSRF token", async ({ request }) => {
    const res = await request.get("/api/auth/csrf");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.csrfToken).toBeTruthy();
    expect(typeof data.csrfToken).toBe("string");
    expect(data.csrfToken.length).toBeGreaterThan(10);
  });
});

test.describe("Phase 1b: Auth Route — Session", () => {
  test("GET /api/auth/session returns null when unauthenticated", async ({ request }) => {
    const res = await request.get("/api/auth/session");
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toBe("null");
  });

  test("GET /api/auth/session returns user data when authenticated", async ({ request }) => {
    const csrfRes = await request.get("/api/auth/csrf");
    const { csrfToken } = await csrfRes.json();

    await request.post("/api/auth/callback/credentials", {
      form: { csrfToken, email: TEACHER_EMAIL, password: TEACHER_PASSWORD },
    });

    const sessionRes = await request.get("/api/auth/session");
    expect(sessionRes.status()).toBe(200);
    const session = await sessionRes.json();
    expect(session.user).toBeTruthy();
    expect(session.user.email).toBe(TEACHER_EMAIL);
    expect(session.user.name).toBe("Teacher");
    expect(session.user.id).toBeTruthy();
    expect(session.expires).toBeTruthy();
  });
});

test.describe("Phase 1c: Auth Route — Providers", () => {
  test("GET /api/auth/providers lists credentials provider", async ({ request }) => {
    const res = await request.get("/api/auth/providers");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.credentials).toBeTruthy();
    expect(data.credentials.id).toBe("credentials");
    expect(data.credentials.type).toBe("credentials");
    expect(data.credentials.signinUrl).toContain("/api/auth/signin/credentials");
    expect(data.credentials.callbackUrl).toContain("/api/auth/callback/credentials");
  });
});

test.describe("Phase 1d: Auth Route — Login Flow", () => {
  test("POST /api/auth/callback/credentials with valid creds sets session cookie", async ({ page }) => {
    const csrfRes = await page.request.get("/api/auth/csrf");
    const { csrfToken } = await csrfRes.json();

    const res = await page.request.post("/api/auth/callback/credentials", {
      form: { csrfToken, email: TEACHER_EMAIL, password: TEACHER_PASSWORD },
    });
    expect(res.status()).toBe(200);

    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((c) => c.name === "authjs.session-token");
    expect(sessionCookie).toBeTruthy();
    expect(sessionCookie!.value.length).toBeGreaterThan(50);
  });

  test("POST /api/auth/callback/credentials with wrong password fails", async ({ request }) => {
    const csrfRes = await request.get("/api/auth/csrf");
    const { csrfToken } = await csrfRes.json();

    const res = await request.post("/api/auth/callback/credentials", {
      form: { csrfToken, email: TEACHER_EMAIL, password: "wrongpassword" },
    });
    const text = await res.text();
    expect(text).toContain("CredentialsSignin");
  });

  test("POST /api/auth/callback/credentials with nonexistent email fails", async ({ request }) => {
    const csrfRes = await request.get("/api/auth/csrf");
    const { csrfToken } = await csrfRes.json();

    const res = await request.post("/api/auth/callback/credentials", {
      form: { csrfToken, email: "nobody@example.com", password: "password123" },
    });
    const text = await res.text();
    expect(text).toContain("CredentialsSignin");
  });

  test("POST /api/auth/callback/credentials with empty fields fails", async ({ request }) => {
    const csrfRes = await request.get("/api/auth/csrf");
    const { csrfToken } = await csrfRes.json();

    const res = await request.post("/api/auth/callback/credentials", {
      form: { csrfToken, email: "", password: "" },
    });
    const text = await res.text();
    expect(text).toContain("CredentialsSignin");
  });
});

test.describe("Phase 1e: Protected Routes — Unauthenticated", () => {
  const protectedEndpoints = [
    { method: "GET" as const, path: "/api/dashboard" },
    { method: "GET" as const, path: "/api/classes" },
    { method: "GET" as const, path: "/api/students" },
    { method: "GET" as const, path: "/api/attendance/sessions" },
    { method: "GET" as const, path: "/api/assignments" },
    { method: "GET" as const, path: "/api/reports?type=attendance&classId=x" },
    { method: "GET" as const, path: "/api/ai?classId=x" },
  ];

  for (const endpoint of protectedEndpoints) {
    test(`${endpoint.method} ${endpoint.path} returns 401 without auth`, async ({ request }) => {
      const res = await request.get(endpoint.path);
      expect(res.status()).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Unauthorized");
    });
  }
});

test.describe("Phase 1f: Protected Routes — Authenticated", () => {
  test("GET /api/dashboard returns 200 with valid session", async ({ page }) => {
    await page.request.get("/api/auth/csrf").then(async (csrfRes) => {
      const { csrfToken } = await csrfRes.json();
      await page.request.post("/api/auth/callback/credentials", {
        form: { csrfToken, email: TEACHER_EMAIL, password: TEACHER_PASSWORD },
      });
    });

    const res = await page.request.get("/api/dashboard");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.totalClasses).toBeGreaterThanOrEqual(3);
    expect(data.totalStudents).toBeGreaterThanOrEqual(15);
    expect(data.classesWithStats).toBeTruthy();
  });

  test("GET /api/classes returns 200 with valid session", async ({ page }) => {
    await page.request.get("/api/auth/csrf").then(async (csrfRes) => {
      const { csrfToken } = await csrfRes.json();
      await page.request.post("/api/auth/callback/credentials", {
        form: { csrfToken, email: TEACHER_EMAIL, password: TEACHER_PASSWORD },
      });
    });

    const res = await page.request.get("/api/classes");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(3);
  });
});

test.describe("Phase 1g: Proxy Middleware — Page Redirects", () => {
  test("unauthenticated user visiting /dashboard gets redirected to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated user visiting /classes gets redirected to /login", async ({ page }) => {
    await page.goto("/classes");
    await expect(page).toHaveURL(/\/login/);
  });

  test("authenticated user can access /dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(TEACHER_EMAIL);
    await page.getByLabel("Password").fill(TEACHER_PASSWORD);
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
