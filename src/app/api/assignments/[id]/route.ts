import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { asyncHandler, ApiError, sendSuccess } from "@/lib/api-utils";
import { updateAssignmentSchema } from "@/lib/validations";

export const GET = asyncHandler(async (request: NextRequest, context) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const { id } = await context!.params;
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      submissions: {
        include: { student: { select: { id: true, name: true, rollNumber: true } } },
        orderBy: { student: { rollNumber: "asc" } },
      },
    },
  });
  if (!assignment) {
    throw new ApiError(404, "Assignment not found");
  }
  return sendSuccess(assignment, "Assignment retrieved successfully");
});

export const PUT = asyncHandler(async (request: NextRequest, context) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const { id } = await context!.params;
  const existing = await prisma.assignment.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Assignment not found");
  }

  const body = await request.json();
  const parsed = updateAssignmentSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, "Validation failed", Object.values(parsed.error.flatten().fieldErrors).flat());
  }

  const assignment = await prisma.assignment.update({
    where: { id },
    data: parsed.data.dueDate
      ? { ...parsed.data, dueDate: new Date(parsed.data.dueDate as string) }
      : parsed.data,
  });
  return sendSuccess(assignment, "Assignment updated successfully");
});

export const DELETE = asyncHandler(async (request: NextRequest, context) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const { id } = await context!.params;
  const existing = await prisma.assignment.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Assignment not found");
  }

  await prisma.assignment.delete({ where: { id } });
  return sendSuccess({ deleted: true }, "Assignment deleted successfully");
});
