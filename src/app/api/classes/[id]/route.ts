import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { asyncHandler, ApiError, sendSuccess } from "@/lib/api-utils";
import { updateClassSchema } from "@/lib/validations";

export const GET = asyncHandler(async (request: NextRequest, context) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const { id } = await context!.params;
  const cls = await prisma.class.findUnique({
    where: { id },
    include: { students: { orderBy: { rollNumber: "asc" } } },
  });
  if (!cls) {
    throw new ApiError(404, "Class not found");
  }
  return sendSuccess(cls, "Class retrieved successfully");
});

export const PUT = asyncHandler(async (request: NextRequest, context) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const { id } = await context!.params;
  const existing = await prisma.class.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Class not found");
  }

  const body = await request.json();
  const parsed = updateClassSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, "Validation failed", Object.values(parsed.error.flatten().fieldErrors).flat());
  }

  const cls = await prisma.class.update({ where: { id }, data: parsed.data });
  return sendSuccess(cls, "Class updated successfully");
});

export const DELETE = asyncHandler(async (request: NextRequest, context) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const { id } = await context!.params;
  const existing = await prisma.class.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Class not found");
  }

  await prisma.class.delete({ where: { id } });
  return sendSuccess({ deleted: true }, "Class deleted successfully");
});
