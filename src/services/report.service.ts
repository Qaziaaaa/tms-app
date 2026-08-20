import { prisma } from "@/lib/prisma";

export async function getAttendanceReport(classId: string) {
  const students = await prisma.student.findMany({
    where: { classId },
    orderBy: { rollNumber: "asc" },
  });

  const totalSessions = await prisma.attendanceSession.count({ where: { classId } });

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

  return { type: "attendance" as const, classId, totalSessions, students: studentStats };
}

export async function getSubmissionsReport(classId: string) {
  const students = await prisma.student.findMany({
    where: { classId },
    orderBy: { rollNumber: "asc" },
  });

  const assignments = await prisma.assignment.findMany({ where: { classId } });

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

  return {
    type: "submissions" as const,
    classId,
    totalAssignments: assignments.length,
    students: studentStats,
  };
}
