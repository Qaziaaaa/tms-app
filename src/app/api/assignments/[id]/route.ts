import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { asyncHandler, ApiError, sendSuccess } from "@/lib/api-utils";
import { getAssignmentById, updateAssignment, deleteAssignment } from "@/services/assignment.service";
import { updateAssignmentSchema } from "@/lib/validations";

export const GET = asyncHandler(async (request: NextRequest, context) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const { id } = await context!.params;
  const assignment = await getAssignmentById(id);
  return sendSuccess(assignment, "Assignment retrieved successfully");
});

export const PUT = asyncHandler(async (request: NextRequest, context) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const { id } = await context!.params;
  const body = await request.json();
  const parsed = updateAssignmentSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, "Validation failed", Object.values(parsed.error.flatten().fieldErrors).flat());
  }

  const assignment = await updateAssignment(id, parsed.data);
  return sendSuccess(assignment, "Assignment updated successfully");
});

export const DELETE = asyncHandler(async (request: NextRequest, context) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const { id } = await context!.params;
  await deleteAssignment(id);
  return sendSuccess({ deleted: true }, "Assignment deleted successfully");
});
