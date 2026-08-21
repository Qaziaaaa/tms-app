import { connectDB } from "@/lib/db";
import { Class, Student, AttendanceSession, AttendanceRecord, Assignment } from "@/models";
import { RECENT_ITEMS_LIMIT } from "@/lib/constants";

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
    .limit(RECENT_ITEMS_LIMIT)
    .lean();

  const recentAttendance = await Promise.all(
    recentSessions.map(async (session) => {
      const recordCount = await AttendanceRecord.countDocuments({ sessionId: session._id });
      const presentCount = await AttendanceRecord.countDocuments({ sessionId: session._id, status: "PRESENT" });
      return { ...session, recordCount, presentCount };
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

  const totalAssignmentSubmissions = await Assignment.countDocuments();
  const assignmentIds = (await Assignment.find().select("_id").lean()).map((a) => a._id);
  const totalSubmissions = assignmentIds.length > 0
    ? await Assignment.countDocuments({ _id: { $in: assignmentIds } })
    : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaySessions = await AttendanceSession.find({ date: { $gte: today } }).select("_id").lean();
  const todaySessionIds = todaySessions.map((s) => s._id);

  let todayPresent = 0;
  let todayAbsent = 0;
  if (todaySessionIds.length > 0) {
    todayPresent = await AttendanceRecord.countDocuments({
      sessionId: { $in: todaySessionIds },
      status: "PRESENT",
    });
    todayAbsent = await AttendanceRecord.countDocuments({
      sessionId: { $in: todaySessionIds },
      status: "ABSENT",
    });
  }

  const recentStudents = await Student.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("classId", "name")
    .lean();

  return {
    totalClasses,
    totalStudents,
    totalSessions,
    totalAssignments: totalAssignmentSubmissions,
    totalSubmissions,
    recentAttendance,
    classesWithStats,
    todayAttendance: { present: todayPresent, absent: todayAbsent },
    recentStudents,
  };
}
