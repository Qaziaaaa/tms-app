import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { asyncHandler, ApiError, sendSuccess } from "@/lib/api-utils";
import { getStudentById, updateStudent, deleteStudent } from "@/services/student.service";
import { createStudentSchema } from "@/lib/validations";

export const GET = asyncHandler(async (request: NextRequest, context) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const { id } = await context!.params;
  const student = await getStudentById(id);
  return sendSuccess(student, "Student retrieved successfully");
});

export const PUT = asyncHandler(async (request: NextRequest, context) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const { id } = await context!.params;
  const body = await request.json();
  const parsed = createStudentSchema.partial().safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, "Validation failed", Object.values(parsed.error.flatten().fieldErrors).flat());
  }

  const student = await updateStudent(id, parsed.data);
  return sendSuccess(student, "Student updated successfully");
});

export const DELETE = asyncHandler(async (request: NextRequest, context) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const { id } = await context!.params;
  await deleteStudent(id);
  return sendSuccess({ deleted: true }, "Student deleted successfully");
});
