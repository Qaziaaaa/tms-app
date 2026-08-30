import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { asyncHandler, ApiError, sendSuccess } from "@/lib/api-utils";
import { turnInSubmissionSchema } from "@/lib/validations";
import { turnInAssignment, unsubmitAssignment } from "@/services/student-portal.service";

export const POST = asyncHandler(async (request: NextRequest, context) => {
  const auth = await requireRole(request, "student");
  if ("error" in auth) return auth.error;

  const { id: assignmentId } = await context!.params;
  const body = await request.json();
  const parsed = turnInSubmissionSchema.safeParse({
    ...body,
    assignmentId,
  });
  if (!parsed.success) {
    throw new ApiError(400, "Validation failed", Object.values(parsed.error.flatten().fieldErrors).flat());
  }

  const data = await turnInAssignment(auth.email, parsed.data);
  return sendSuccess(data, "Assignment turned in successfully");
});

export const DELETE = asyncHandler(async (request: NextRequest, context) => {
  const auth = await requireRole(request, "student");
  if ("error" in auth) return auth.error;

  const { id: assignmentId } = await context!.params;
  const data = await unsubmitAssignment(auth.email, assignmentId);
  return sendSuccess(data, "Assignment unsubmitted");
});
