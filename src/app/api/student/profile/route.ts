import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { asyncHandler, sendSuccess } from "@/lib/api-utils";
import { getStudentProfile } from "@/services/student-portal.service";

export const GET = asyncHandler(async (request: NextRequest) => {
  const auth = await requireRole(request, "student");
  if ("error" in auth) return auth.error;

  const profile = await getStudentProfile(auth.email);
  return sendSuccess(profile, "Student profile retrieved successfully");
});
