import { connectDB } from "@/lib/db";
import { Student, AttendanceSession, AttendanceRecord, Assignment, AssignmentSubmission } from "@/models";
import { ApiError } from "@/lib/api-utils";

export async function getAttendanceReport(classId: string) {
  await connectDB();

  const students = await Student.find({ classId }).sort({ rollNumber: "asc" }).lean();
  const sessions = await AttendanceSession.find({ classId }).select("_id").lean();
  const totalSessions = sessions.length;
  const sessionIds = sessions.map((s) => s._id);

  const studentStats = await Promise.all(
    students.map(async (student) => {
      const presentCount = await AttendanceRecord.countDocuments({
        studentId: student._id,
        sessionId: { $in: sessionIds },
        status: "PRESENT",
      });
      const attendancePercentage = totalSessions > 0
        ? Math.round((presentCount / totalSessions) * 100)
        : 0;
      return {
        id: student._id,
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
  await connectDB();

  const students = await Student.find({ classId }).sort({ rollNumber: "asc" }).lean();
  const assignments = await Assignment.find({ classId }).lean();

  const studentStats = await Promise.all(
    students.map(async (student) => {
      const submissions = await AssignmentSubmission.find({
        studentId: student._id,
        assignmentId: { $in: assignments.map((a) => a._id) },
      }).lean();

      const submittedCount = submissions.filter(
        (s) => s.status === "SUBMITTED" || s.status === "LATE"
      ).length;

      const totalMarksObtained = submissions.reduce((sum, s) => sum + (s.marks ?? 0), 0);
      const totalPossibleMarks = assignments.reduce((sum, a) => sum + a.totalMarks, 0);

      const averageMarks = totalPossibleMarks > 0
        ? Math.round((totalMarksObtained / totalPossibleMarks) * 100)
        : 0;

      return {
        id: student._id,
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
