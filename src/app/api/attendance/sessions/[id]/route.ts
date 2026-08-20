import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { asyncHandler, ApiError, sendSuccess } from "@/lib/api-utils";

export const GET = asyncHandler(async (request: NextRequest, context) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const { id } = await context!.params;
  const session = await prisma.attendanceSession.findUnique({
    where: { id },
    include: {
      records: {
        include: { student: { select: { id: true, name: true, rollNumber: true } } },
        orderBy: { student: { rollNumber: "asc" } },
      },
    },
  });
  if (!session) {
    throw new ApiError(404, "Session not found");
  }
  return sendSuccess(session, "Session retrieved successfully");
});

export const DELETE = asyncHandler(async (request: NextRequest, context) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const { id } = await context!.params;
  const existing = await prisma.attendanceSession.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Session not found");
  }

  await prisma.attendanceSession.delete({ where: { id } });
  return sendSuccess({ deleted: true }, "Session deleted successfully");
});
