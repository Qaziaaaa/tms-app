import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const TEACHER_ROUTES = ["/dashboard", "/classes", "/students", "/attendance", "/assignments", "/insights", "/reports"];
const STUDENT_ROUTES = ["/student"];

function isTeacherRoute(pathname: string): boolean {
  return TEACHER_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

function isStudentRoute(pathname: string): boolean {
  return STUDENT_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/login" || pathname.startsWith("/api/auth") || pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, message: "Authentication required", errors: [], data: null }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = token.role as string;

  if (pathname === "/login") {
    return NextResponse.redirect(new URL(role === "student" ? "/student/dashboard" : "/dashboard", request.url));
  }

  if (isTeacherRoute(pathname) && role !== "teacher") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (isStudentRoute(pathname) && role !== "student") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
