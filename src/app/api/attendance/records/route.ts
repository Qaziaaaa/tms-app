import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { asyncHandler, ApiError, sendSuccess } from "@/lib/api-utils";
import { saveAttendanceSchema } from "@/lib/validations";

export const POST = asyncHandler(async (request: NextRequest) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = saveAttendanceSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, "Validation failed", Object.values(parsed.error.flatten().fieldErrors).flat());
  }

  const { sessionId, records } = parsed.data;

  const session = await prisma.attendanceSession.findUnique({ where: { id: sessionId } });
  if (!session) {
    throw new ApiError(404, "Session not found");
  }

  const upserts = records.map((record) =>
    prisma.attendanceRecord.upsert({
      where: { sessionId_studentId: { sessionId, studentId: record.studentId } },
      update: { status: record.status },
      create: { sessionId, studentId: record.studentId, status: record.status },
    })
  );

  await Promise.all(upserts);

  const updated = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    include: { records: true },
  });

  return sendSuccess(updated, "Attendance saved successfully");
});
