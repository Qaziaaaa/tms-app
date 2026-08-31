import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { asyncHandler, sendSuccess, ApiError } from "@/lib/api-utils";
import { getTeacherProfile, updateTeacherProfile } from "@/services/student-portal.service";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(60, "Name is too long"),
});

export const GET = asyncHandler(async (request: NextRequest) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const profile = await getTeacherProfile(auth.email);
  return sendSuccess(profile, "Teacher profile retrieved successfully");
});

export const PUT = asyncHandler(async (request: NextRequest) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, "Validation failed", Object.values(parsed.error.flatten().fieldErrors).flat());
  }

  const updated = await updateTeacherProfile(auth.email, parsed.data.name);
  return sendSuccess(updated, "Profile updated successfully");
});
