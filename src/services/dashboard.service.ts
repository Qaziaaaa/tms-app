import { connectDB } from "@/lib/db";
import { Class, Student, AttendanceSession, AttendanceRecord, Assignment, AssignmentSubmission } from "@/models";

export async function getDashboard() {
  await connectDB();

  const [totalClasses, totalStudents, totalSessions, totalAssignments] = await Promise.all([
    Class.countDocuments(),
    Student.countDocuments(),
    AttendanceSession.countDocuments(),
    Assignment.countDocuments(),
  ]);

  const recentSessions = await AttendanceSession.find()
    .populate("classId", "name")
    .sort({ date: -1 })
    .limit(5)
    .lean();

  const recentAttendance = await Promise.all(
    recentSessions.map(async (session) => {
      const recordCount = await AttendanceRecord.countDocuments({ sessionId: session._id });
      return { ...session, recordCount };
    })
  );

  const classes = await Class.find().lean();

  const classesWithStats = await Promise.all(
    classes.map(async (cls) => {
      const studentCount = await Student.countDocuments({ classId: cls._id });
      const sessionCount = await AttendanceSession.countDocuments({ classId: cls._id });

      let averageAttendance = 0;
      if (sessionCount > 0 && studentCount > 0) {
        const sessions = await AttendanceSession.find({ classId: cls._id }).select("_id").lean();
        const sessionIds = sessions.map((s) => s._id);
        const presentCount = await AttendanceRecord.countDocuments({
          sessionId: { $in: sessionIds },
          status: "PRESENT",
        });
        const totalPossible = sessionCount * studentCount;
        averageAttendance = totalPossible > 0
          ? Math.round((presentCount / totalPossible) * 100)
          : 0;
      }

      return {
        ...cls,
        studentCount,
        sessionCount,
        averageAttendance,
      };
    })
  );

  return {
    totalClasses,
    totalStudents,
    totalSessions,
    totalAssignments,
    recentAttendance,
    classesWithStats,
  };
}
