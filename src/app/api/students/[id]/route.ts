import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { asyncHandler, ApiError, sendSuccess } from "@/lib/api-utils";
import { createStudentSchema } from "@/lib/validations";

export const GET = asyncHandler(async (request: NextRequest, context) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const { id } = await context!.params;
  const student = await prisma.student.findUnique({
    where: { id },
    include: { class: true },
  });
  if (!student) {
    throw new ApiError(404, "Student not found");
  }
  return sendSuccess(student, "Student retrieved successfully");
});

export const PUT = asyncHandler(async (request: NextRequest, context) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const { id } = await context!.params;
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Student not found");
  }

  const body = await request.json();
  const parsed = createStudentSchema.partial().safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, "Validation failed", Object.values(parsed.error.flatten().fieldErrors).flat());
  }

  const student = await prisma.student.update({ where: { id }, data: parsed.data });
  return sendSuccess(student, "Student updated successfully");
});

export const DELETE = asyncHandler(async (request: NextRequest, context) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const { id } = await context!.params;
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Student not found");
  }

  await prisma.student.delete({ where: { id } });
  return sendSuccess({ deleted: true }, "Student deleted successfully");
});
