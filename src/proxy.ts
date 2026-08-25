import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { checkRateLimit } from "@/lib/rate-limit";

const TEACHER_ROUTES = ["/dashboard", "/classes", "/students", "/attendance", "/assignments", "/insights", "/reports", "/settings"];
const STUDENT_ROUTES = ["/student"];

function isTeacherRoute(pathname: string): boolean {
  return TEACHER_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

function isStudentRoute(pathname: string): boolean {
  return STUDENT_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

function getClientIP(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "127.0.0.1";
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.includes(".")) {
    return addSecurityHeaders(NextResponse.next());
  }

  if (pathname.startsWith("/api/auth/callback/credentials") && request.method === "POST") {
    const ip = getClientIP(request);
    const { allowed, remainingMs } = checkRateLimit(`login:${ip}`);
    if (!allowed) {
      const retryAfter = Math.ceil(remainingMs / 1000);
      const res = NextResponse.json(
        { success: false, message: `Too many login attempts. Try again in ${retryAfter}s.` },
        { status: 429 }
      );
      res.headers.set("Retry-After", String(retryAfter));
      return addSecurityHeaders(res);
    }
  }

  if (pathname === "/login" || pathname.startsWith("/api/auth")) {
    if (pathname === "/login") {
      const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
      if (token) {
        const role = token.role as string;
        return addSecurityHeaders(NextResponse.redirect(new URL(role === "student" ? "/student/dashboard" : "/dashboard", request.url)));
      }
    }
    return addSecurityHeaders(NextResponse.next());
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return addSecurityHeaders(NextResponse.json({ success: false, message: "Authentication required", errors: [], data: null }, { status: 401 }));
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return addSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  const role = token.role as string;

  if (isTeacherRoute(pathname) && role !== "teacher") {
    return addSecurityHeaders(NextResponse.redirect(new URL("/login", request.url)));
  }
  if (isStudentRoute(pathname) && role !== "student") {
    return addSecurityHeaders(NextResponse.redirect(new URL("/login", request.url)));
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
