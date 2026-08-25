import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { asyncHandler, ApiError, sendSuccess } from "@/lib/api-utils";
import { getClassDetail, updateClass, deleteClass } from "@/services/class.service";
import { updateClassSchema } from "@/lib/validations";

export const GET = asyncHandler(async (request: NextRequest, context) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const { id } = await context!.params;
  const detail = await getClassDetail(id);
  return sendSuccess(detail, "Class retrieved successfully");
});

export const PUT = asyncHandler(async (request: NextRequest, context) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const { id } = await context!.params;
  const body = await request.json();
  const parsed = updateClassSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, "Validation failed", Object.values(parsed.error.flatten().fieldErrors).flat());
  }

  const cls = await updateClass(id, parsed.data);
  return sendSuccess(cls, "Class updated successfully");
});

export const DELETE = asyncHandler(async (request: NextRequest, context) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const { id } = await context!.params;
  await deleteClass(id);
  return sendSuccess({ deleted: true }, "Class deleted successfully");
});
