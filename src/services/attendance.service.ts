import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-utils";

export async function getSessions(classId: string | null) {
  const where = classId ? { classId } : {};
  return prisma.attendanceSession.findMany({
    where,
    include: { _count: { select: { records: true } } },
    orderBy: { date: "desc" },
  });
}

export async function getSessionById(id: string) {
  const session = await prisma.attendanceSession.findUnique({
    where: { id },
    include: {
      records: {
        include: { student: { select: { id: true, name: true, rollNumber: true } } },
        orderBy: { student: { rollNumber: "asc" } },
      },
    },
  });
  if (!session) throw new ApiError(404, "Session not found");
  return session;
}

export async function createSession(classId: string, date: Date) {
  const existing = await prisma.attendanceSession.findUnique({
    where: { classId_date: { classId, date } },
  });
  if (existing) {
    throw new ApiError(409, "Attendance session already exists for this class and date");
  }
  return prisma.attendanceSession.create({ data: { classId, date } });
}

export async function deleteSession(id: string) {
  const existing = await prisma.attendanceSession.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Session not found");
  await prisma.attendanceSession.delete({ where: { id } });
}

export async function saveAttendance(sessionId: string, records: { studentId: string; status: "PRESENT" | "ABSENT" | "LATE" }[]) {
  const session = await prisma.attendanceSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new ApiError(404, "Session not found");

  const upserts = records.map((record) =>
    prisma.attendanceRecord.upsert({
      where: { sessionId_studentId: { sessionId, studentId: record.studentId } },
      update: { status: record.status },
      create: { sessionId, studentId: record.studentId, status: record.status },
    })
  );

  await Promise.all(upserts);

  return prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    include: { records: true },
  });
}
