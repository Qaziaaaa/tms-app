import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Class, Student, AttendanceSession, AttendanceRecord, Assignment, AssignmentSubmission } from "@/models";
import { ApiError } from "@/lib/api-utils";

export async function getClasses() {
  await connectDB();
  const classes = await Class.find().sort({ createdAt: -1 }).lean();

  const classIds = classes.map((c) => c._id);

  const [studentCounts, sessionCounts, presentCounts] = await Promise.all([
    Student.aggregate([
      { $match: { classId: { $in: classIds } } },
      { $group: { _id: "$classId", count: { $sum: 1 } } },
    ]),
    AttendanceSession.aggregate([
      { $match: { classId: { $in: classIds } } },
      { $group: { _id: "$classId", count: { $sum: 1 } } },
    ]),
    AttendanceRecord.aggregate([
      { $lookup: { from: "attendancesessions", localField: "sessionId", foreignField: "_id", as: "session" } },
      { $unwind: "$session" },
      { $match: { "session.classId": { $in: classIds }, status: "PRESENT" } },
      { $group: { _id: "$session.classId", count: { $sum: 1 } } },
    ]),
  ]);

  const studentMap = new Map(studentCounts.map((d) => [String(d._id), d.count]));
  const sessionMap = new Map(sessionCounts.map((d) => [String(d._id), d.count]));
  const presentMap = new Map(presentCounts.map((d) => [String(d._id), d.count]));

  return classes.map((cls) => {
    const id = String(cls._id);
    const studentCount = studentMap.get(id) || 0;
    const sessionCount = sessionMap.get(id) || 0;
    const presentCount = presentMap.get(id) || 0;
    const totalPossible = sessionCount * studentCount;
    const averageAttendance = totalPossible > 0 ? Math.round((presentCount / totalPossible) * 100) : 0;
    return { ...cls, studentCount, sessionCount, averageAttendance };
  });
}

export async function getClassById(id: string) {
  await connectDB();
  const cls = await Class.findOne({ _id: id }).lean();
  if (!cls) throw new ApiError(404, "Class not found");

  const students = await Student.find({ classId: id }).sort({ rollNumber: "asc" }).lean();
  return { ...cls, students };
}

export async function createClass(data: {
  name: string;
  department: string;
  batch: string;
  schedule?: string;
}) {
  await connectDB();
  return Class.create(data);
}

export async function updateClass(id: string, data: {
  name?: string;
  department?: string;
  batch?: string;
  schedule?: string;
}) {
  await connectDB();
  const cls = await Class.findOneAndUpdate({ _id: id }, data, { new: true });
  if (!cls) throw new ApiError(404, "Class not found");
  return cls;
}

export async function deleteClass(id: string) {
  await connectDB();
  const { Student, AttendanceSession, AttendanceRecord, Assignment, AssignmentSubmission } = await import("@/models");
  await mongoose.connection.transaction(async (session) => {
    const cls = await Class.findOneAndDelete({ _id: id }, { session });
    if (!cls) throw new ApiError(404, "Class not found");

    const sessions = await AttendanceSession.find({ classId: id }).select("_id").session(session).lean();
    const sessionIds = sessions.map((s) => s._id);
    await AttendanceRecord.deleteMany({ sessionId: { $in: sessionIds } }, { session });
    await AttendanceSession.deleteMany({ classId: id }, { session });

    const assignments = await Assignment.find({ classId: id }).select("_id").session(session).lean();
    const assignmentIds = assignments.map((a) => a._id);
    await AssignmentSubmission.deleteMany({ assignmentId: { $in: assignmentIds } }, { session });
    await Assignment.deleteMany({ classId: id }, { session });

    await Student.deleteMany({ classId: id }, { session });
  });
}

export async function getClassDetail(id: string) {
  await connectDB();
  const cls = await Class.findOne({ _id: id }).lean();
  if (!cls) throw new ApiError(404, "Class not found");

  const students = await Student.find({ classId: id }).sort({ rollNumber: "asc" }).lean();
  const sessionCount = await AttendanceSession.countDocuments({ classId: id });
  const totalAssignments = await Assignment.countDocuments({ classId: id });

  const sessions = await AttendanceSession.find({ classId: id }).sort({ date: -1 }).limit(5).lean();
  const recentSessions = await Promise.all(
    sessions.map(async (s) => {
      const recordCount = await AttendanceRecord.countDocuments({ sessionId: s._id });
      const presentCount = await AttendanceRecord.countDocuments({ sessionId: s._id, status: "PRESENT" });
      return { id: String(s._id), dateKey: s.dateKey, date: s.date, presentCount, recordCount };
    })
  );

  const assignments = await Assignment.find({ classId: id }).sort({ dueDate: -1 }).limit(5).lean();
  const recentAssignments = await Promise.all(
    assignments.map(async (a) => {
      const submissionCount = await AssignmentSubmission.countDocuments({ assignmentId: a._id });
      return { id: String(a._id), title: a.title, dueDate: a.dueDate, totalMarks: a.totalMarks, submissionCount };
    })
  );

  let averageAttendance = 0;
  let averageMarks = 0;
  const allSessionIds = (await AttendanceSession.find({ classId: id }).select("_id").lean()).map((s) => s._id);

  if (sessionCount > 0 && students.length > 0) {
    const presentCount = await AttendanceRecord.countDocuments({ sessionId: { $in: allSessionIds }, status: "PRESENT" });
    const totalPossible = sessionCount * students.length;
    averageAttendance = totalPossible > 0 ? Math.round((presentCount / totalPossible) * 100) : 0;
  }

  if (totalAssignments > 0 && students.length > 0) {
    const studentIds = students.map((s) => s._id);
    const submissions = await AssignmentSubmission.find({ studentId: { $in: studentIds } }).lean();
    const totalMarksObtained = submissions.reduce((sum, s) => sum + (s.marks || 0), 0);
    const assignmentDocs = await Assignment.find({ classId: id }).lean();
    const totalPossible = assignmentDocs.reduce((sum, a) => sum + a.totalMarks, 0) * students.length;
    averageMarks = totalPossible > 0 ? Math.round((totalMarksObtained / totalPossible) * 100) : 0;
  }

  const studentStats = await Promise.all(
    students.map(async (s) => {
      let attendancePct = 0;
      if (sessionCount > 0 && allSessionIds.length > 0) {
        const attended = await AttendanceRecord.countDocuments({
          studentId: s._id,
          sessionId: { $in: allSessionIds },
          status: "PRESENT",
        });
        attendancePct = Math.round((attended / sessionCount) * 100);
      }
      const subs = await AssignmentSubmission.find({ studentId: s._id }).lean();
      const subsWithMarks = subs.filter((sub) => sub.marks != null);
      const avgMarks = subsWithMarks.length > 0
        ? Math.round(subsWithMarks.reduce((sum, sub) => sum + (sub.marks || 0), 0) / subsWithMarks.length)
        : 0;
      return { id: String(s._id), rollNumber: s.rollNumber, name: s.name, attendancePct, avgMarks };
    })
  );

  return {
    class: { id: String(cls._id), name: cls.name, department: cls.department, batch: cls.batch, schedule: cls.schedule },
    totalStudents: students.length,
    totalSessions: sessionCount,
    averageAttendance,
    averageMarks,
    totalAssignments,
    recentSessions,
    recentAssignments,
    students: studentStats,
  };
}
