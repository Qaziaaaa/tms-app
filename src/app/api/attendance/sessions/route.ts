import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { asyncHandler, ApiError, sendSuccess } from "@/lib/api-utils";
import { createAttendanceSessionSchema } from "@/lib/validations";

export const GET = asyncHandler(async (request: NextRequest) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");

  const where = classId ? { classId } : {};

  const sessions = await prisma.attendanceSession.findMany({
    where,
    include: { _count: { select: { records: true } } },
    orderBy: { date: "desc" },
  });

  return sendSuccess(sessions, "Sessions retrieved successfully");
});

export const POST = asyncHandler(async (request: NextRequest) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = createAttendanceSessionSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, "Validation failed", Object.values(parsed.error.flatten().fieldErrors).flat());
  }

  const { classId, date } = parsed.data;
  const dateObj = new Date(date);

  const existing = await prisma.attendanceSession.findUnique({
    where: { classId_date: { classId, date: dateObj } },
  });
  if (existing) {
    throw new ApiError(409, "Attendance session already exists for this class and date");
  }

  const session = await prisma.attendanceSession.create({
    data: { classId, date: dateObj },
  });

  return sendSuccess(session, "Session created successfully", 201);
});
