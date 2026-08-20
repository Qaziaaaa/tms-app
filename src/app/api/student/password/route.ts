import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { asyncHandler, ApiError, sendSuccess } from "@/lib/api-utils";
import { changePassword } from "@/services/student-portal.service";
import { z } from "zod";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export const PUT = asyncHandler(async (request: NextRequest) => {
  const auth = await requireRole(request, "student");
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, "Validation failed", Object.values(parsed.error.flatten().fieldErrors).flat());
  }

  await changePassword(auth.email, parsed.data.currentPassword, parsed.data.newPassword);
  return sendSuccess({ updated: true }, "Password changed successfully");
});
