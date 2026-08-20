import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { asyncHandler, ApiError, sendSuccess } from "@/lib/api-utils";
import { saveSubmissions } from "@/services/assignment.service";
import { saveSubmissionsSchema } from "@/lib/validations";

export const POST = asyncHandler(async (request: NextRequest, context) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const { id: assignmentId } = await context!.params;
  const body = await request.json();
  const parsed = saveSubmissionsSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, "Validation failed", Object.values(parsed.error.flatten().fieldErrors).flat());
  }

  const updated = await saveSubmissions(assignmentId, parsed.data.submissions);
  return sendSuccess(updated, "Submissions saved successfully");
});
