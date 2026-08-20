import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { asyncHandler, sendSuccess } from "@/lib/api-utils";

export const GET = asyncHandler(async (request: NextRequest) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const [totalClasses, totalStudents, totalSessions, totalAssignments] = await Promise.all([
    prisma.class.count(),
    prisma.student.count(),
    prisma.attendanceSession.count(),
    prisma.assignment.count(),
  ]);

  const recentAttendance = await prisma.attendanceSession.findMany({
    take: 5,
    orderBy: { date: "desc" },
    include: {
      _count: { select: { records: true } },
      class: { select: { name: true } },
    },
  });

  const classes = await prisma.class.findMany({
    include: { students: { select: { id: true } } },
  });

  const classesWithStats = await Promise.all(
    classes.map(async (cls) => {
      const sessionCount = await prisma.attendanceSession.count({
        where: { classId: cls.id },
      });

      let averageAttendance = 0;
      if (sessionCount > 0 && cls.students.length > 0) {
        const presentCount = await prisma.attendanceRecord.count({
          where: {
            session: { classId: cls.id },
            status: "PRESENT",
          },
        });
        const totalPossible = sessionCount * cls.students.length;
        averageAttendance = totalPossible > 0
          ? Math.round((presentCount / totalPossible) * 100)
          : 0;
      }

      return {
        id: cls.id,
        name: cls.name,
        studentCount: cls.students.length,
        sessionCount,
        averageAttendance,
      };
    })
  );

  return sendSuccess({
    totalClasses,
    totalStudents,
    totalSessions,
    totalAssignments,
    recentAttendance,
    classesWithStats,
  }, "Dashboard data retrieved successfully");
});
