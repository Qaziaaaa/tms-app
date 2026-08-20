import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { asyncHandler, ApiError, sendSuccess } from "@/lib/api-utils";

export const GET = asyncHandler(async (request: NextRequest) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const type = searchParams.get("type");

  if (!classId) {
    throw new ApiError(400, "classId is required");
  }
  if (!type || !["attendance", "submissions"].includes(type)) {
    throw new ApiError(400, "type must be 'attendance' or 'submissions'");
  }

  const students = await prisma.student.findMany({
    where: { classId },
    orderBy: { rollNumber: "asc" },
  });

  if (type === "attendance") {
    const totalSessions = await prisma.attendanceSession.count({
      where: { classId },
    });

    const studentStats = await Promise.all(
      students.map(async (student) => {
        const presentCount = await prisma.attendanceRecord.count({
          where: {
            studentId: student.id,
            session: { classId },
            status: "PRESENT",
          },
        });
        const attendancePercentage = totalSessions > 0
          ? Math.round((presentCount / totalSessions) * 100)
          : 0;
        return {
          id: student.id,
          rollNumber: student.rollNumber,
          name: student.name,
          totalSessions,
          presentCount,
          attendancePercentage,
        };
      })
    );

    return sendSuccess({ type: "attendance", classId, totalSessions, students: studentStats }, "Attendance report generated");
  }

  const assignments = await prisma.assignment.findMany({
    where: { classId },
  });

  const studentStats = await Promise.all(
    students.map(async (student) => {
      const submissions = await prisma.assignmentSubmission.findMany({
        where: {
          studentId: student.id,
          assignment: { classId },
        },
      });

      const submittedCount = submissions.filter(
        (s) => s.status === "SUBMITTED" || s.status === "LATE"
      ).length;

      const totalMarksObtained = submissions.reduce((sum, s) => sum + (s.marks ?? 0), 0);
      const totalPossibleMarks = assignments.reduce((sum, a) => sum + a.totalMarks, 0);

      const averageMarks = totalPossibleMarks > 0
        ? Math.round((totalMarksObtained / totalPossibleMarks) * 100)
        : 0;

      return {
        id: student.id,
        rollNumber: student.rollNumber,
        name: student.name,
        totalAssignments: assignments.length,
        submittedCount,
        notSubmittedCount: assignments.length - submittedCount,
        totalMarksObtained,
        totalPossibleMarks,
        averageMarks,
      };
    })
  );

  return sendSuccess({
    type: "submissions",
    classId,
    totalAssignments: assignments.length,
    students: studentStats,
  }, "Submissions report generated");
});
