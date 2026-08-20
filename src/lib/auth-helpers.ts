import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { sendError } from "@/lib/api-utils";

type AuthResult =
  | { userId: string; role: string; error?: never }
  | { userId?: never; role?: never; error: ReturnType<typeof sendError> };

export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return { error: sendError(401, "Authentication required") };
  }

  return { userId: token.id as string, role: token.role as string };
}

export async function requireRole(
  request: NextRequest,
  ...allowedRoles: string[]
): Promise<AuthResult> {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth;

  if (!allowedRoles.includes(auth.role)) {
    return {
      error: sendError(403, "Forbidden: Insufficient permissions", [
        `Role '${auth.role}' is not authorized to access this resource.`,
      ]),
    };
  }

  return auth;
}
