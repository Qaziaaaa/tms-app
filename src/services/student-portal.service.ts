import { connectDB } from "@/lib/db";
import { User, Student, AttendanceRecord, AttendanceSession, Assignment, AssignmentSubmission, Class } from "@/models";
import { ApiError } from "@/lib/api-utils";
import bcrypt from "bcryptjs";

async function findStudentByEmail(email: string) {
  const user = await User.findOne({ email }).lean();
  if (!user) throw new ApiError(404, "User not found");
  const student = await Student.findOne({ userId: String(user._id) }).lean();
  if (!student) throw new ApiError(404, "Student profile not found");
  return { user, student };
}

export async function getStudentProfile(email: string) {
  await connectDB();
  const { user, student } = await findStudentByEmail(email);

  const classDoc = await Class.findOne({ _id: student.classId }).lean();

  const attendanceRecords = await AttendanceRecord.find({ studentId: student._id }).lean();
  const presentCount = attendanceRecords.filter((r) => r.status === "PRESENT").length;
  const totalDays = attendanceRecords.length;
  const attendancePercentage = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

  const assignmentIds = (await Assignment.find({ classId: student.classId }).select("_id").lean()).map((a) => a._id);
  const totalAssignments = assignmentIds.length;
  const submissions = await AssignmentSubmission.find({
    studentId: student._id,
    assignmentId: { $in: assignmentIds },
    status: { $in: ["SUBMITTED", "LATE"] },
  }).lean();
  const submittedCount = submissions.length;

  const gradedSubmissions = submissions.filter((s) => s.marks !== null && s.marks !== undefined);
  let overallPercentage = 0;
  if (gradedSubmissions.length > 0) {
    const totalMarks = gradedSubmissions.reduce((acc, s) => acc + (s.marks ?? 0), 0);
    const assignmentsMap = new Map(
      (await Assignment.find({ _id: { $in: gradedSubmissions.map((s) => s.assignmentId) } }).lean()).map((a) => [String(a._id), a.totalMarks])
    );
    const totalPossible = gradedSubmissions.reduce((acc, s) => acc + (assignmentsMap.get(String(s.assignmentId)) || 100), 0);
    overallPercentage = totalPossible > 0 ? Math.round((totalMarks / totalPossible) * 100) : 0;
  }

  return {
    id: String(student._id),
    name: student.name,
    email: user.email,
    rollNumber: student.rollNumber,
    class: classDoc
      ? {
          id: String(classDoc._id),
          name: classDoc.name,
          department: classDoc.department,
          batch: classDoc.batch,
          schedule: classDoc.schedule,
        }
      : null,
    stats: {
      attendancePercentage,
      totalDays,
      presentCount,
      totalAssignments,
      submittedCount,
      overallPercentage,
    },
    joinedAt: user.createdAt,
  };
}

export async function getStudentAttendance(email: string) {
  await connectDB();
  const { student } = await findStudentByEmail(email);

  const records = await AttendanceRecord.find({ studentId: student._id })
    .populate({
      path: "sessionId",
      select: "date classId",
      populate: { path: "classId", select: "name" },
    })
    .sort({ "sessionId.date": -1 })
    .lean();

  const presentCount = records.filter((r) => r.status === "PRESENT").length;
  const absentCount = records.filter((r) => r.status === "ABSENT").length;
  const totalDays = records.length;
  const percentage = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyMap = new Map<string, { month: string; present: number; absent: number; total: number }>();

  for (const r of records) {
    const session = r.sessionId as unknown as { date: string } | null;
    if (!session?.date) continue;
    const d = new Date(session.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = monthNames[d.getMonth()];
    const entry = monthlyMap.get(key) || { month: label, present: 0, absent: 0, total: 0 };
    if (r.status === "PRESENT") entry.present++;
    else entry.absent++;
    entry.total++;
    monthlyMap.set(key, entry);
  }

  const monthlyBreakdown = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([, v]) => ({ month: v.month, present: v.present, absent: v.absent, total: v.total }));

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  for (let i = records.length - 1; i >= 0; i--) {
    if (records[i].status === "PRESENT") {
      tempStreak++;
    } else {
      if (i === records.length - 1) currentStreak = 0;
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 0;
    }
  }
  if (records.length > 0 && records[records.length - 1]?.status === "PRESENT") {
    currentStreak = tempStreak;
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  const recentSessions = records.slice(0, 7).map((r) => {
    const session = r.sessionId as unknown as { date: string; classId?: { name: string } } | null;
    return {
      date: session?.date || "",
      status: r.status,
      className: session?.classId?.name || "",
    };
  });

  const mappedRecords = records.map((r) => {
    const session = r.sessionId as unknown as
      | { _id?: unknown; id?: unknown; date?: string; classId?: { name?: string } }
      | null
      | undefined;
    const sessionId = session?.id != null ? String(session.id) : session?._id != null ? String(session._id) : "";
    return {
      id: r._id,
      status: r.status,
      date: session?.date || "",
      session: {
        id: sessionId,
        date: session?.date || "",
        class: { name: session?.classId?.name || "" },
      },
    };
  });

  return {
    records: mappedRecords,
    summary: { present: presentCount, absent: absentCount, totalDays, percentage },
    monthlyBreakdown,
    recentSessions,
    streak: { current: currentStreak, longest: longestStreak },
  };
}

export async function getStudentAssignments(email: string) {
  await connectDB();
  const { student } = await findStudentByEmail(email);

  const assignments = await Assignment.find({ classId: student.classId })
    .sort({ dueDate: -1 })
    .lean();

  const submissions = await AssignmentSubmission.find({
    studentId: student._id,
    assignmentId: { $in: assignments.map((a) => a._id) },
  }).lean();

  const submissionMap = new Map(submissions.map((s) => [String(s.assignmentId), s]));
  const now = new Date();

  const enriched = assignments.map((a) => {
    const sub = submissionMap.get(String(a._id));
    const active = sub && sub.status !== "NOT_SUBMITTED" ? sub : null;
    const isOverdue = !active && new Date(a.dueDate) < now;
    return {
      id: a._id,
      title: a.title,
      description: a.description,
      dueDate: a.dueDate,
      totalMarks: a.totalMarks,
      submission: active
        ? {
            id: sub._id,
            status: sub.status,
            marks: sub.marks,
            submissionLink: sub.submissionLink,
            submissionNote: sub.submissionNote,
            submittedAt: sub.submittedAt,
            reviewedAt: sub.reviewedAt,
          }
        : null,
      isOverdue,
    };
  });

  const submittedCount = enriched.filter((a) => a.submission).length;
  const awaitingCount = enriched.filter((a) => a.submission?.status === "TURNED_IN").length;
  const pendingCount = enriched.filter((a) => !a.submission && !a.isOverdue).length;
  const overdueCount = enriched.filter((a) => !a.submission && a.isOverdue).length;

  const upcoming = enriched
    .filter((a) => !a.submission && new Date(a.dueDate) > now)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  return {
    assignments: enriched,
    summary: {
      total: enriched.length,
      submitted: submittedCount,
      awaiting: awaitingCount,
      pending: pendingCount,
      overdue: overdueCount,
    },
    upcoming,
  };
}

export async function turnInAssignment(email: string, data: {
  assignmentId: string;
  submissionLink?: string;
  submissionNote?: string;
}) {
  await connectDB();
  const { student } = await findStudentByEmail(email);
  const { assignmentId, submissionLink, submissionNote } = data;

  const assignment = await Assignment.findOne({ _id: assignmentId, classId: student.classId });
  if (!assignment) throw new ApiError(404, "Assignment not found");

  const submission = await AssignmentSubmission.findOneAndUpdate(
    { assignmentId, studentId: student._id },
    {
      status: "TURNED_IN",
      submissionLink: submissionLink || undefined,
      submissionNote: submissionNote || undefined,
      submittedAt: new Date(),
      reviewedAt: undefined,
    },
    { upsert: true, new: true }
  ).lean();

  return {
    id: submission._id,
    status: submission.status,
    marks: submission.marks,
    submissionLink: submission.submissionLink,
    submissionNote: submission.submissionNote,
    submittedAt: submission.submittedAt,
    reviewedAt: submission.reviewedAt,
  };
}

export async function unsubmitAssignment(email: string, assignmentId: string) {
  await connectDB();
  const { student } = await findStudentByEmail(email);

  const submission = await AssignmentSubmission.findOneAndUpdate(
    { assignmentId, studentId: student._id, status: "TURNED_IN" },
    {
      status: "NOT_SUBMITTED",
      marks: null,
      reviewedAt: undefined,
    },
    { new: true }
  );

  if (!submission) throw new ApiError(409, "Assignment is already reviewed and cannot be unsubmitted");

  return { id: submission._id, status: submission.status };
}

export async function getStudentGrades(email: string) {
  await connectDB();
  const { student } = await findStudentByEmail(email);

  const assignments = await Assignment.find({ classId: student.classId })
    .sort({ dueDate: -1 })
    .lean();

  const submissions = await AssignmentSubmission.find({ studentId: student._id }).lean();
  const submissionMap = new Map(submissions.map((s) => [String(s.assignmentId), s]));

  let totalMarksObtained = 0;
  let totalPossibleMarks = 0;

  const grades = assignments.map((a) => {
    const sub = submissionMap.get(String(a._id));
    const marks = sub?.marks ?? 0;
    totalMarksObtained += marks;
    totalPossibleMarks += a.totalMarks;
    const percentage = a.totalMarks > 0 ? Math.round((marks / a.totalMarks) * 100) : 0;
    return {
      assignmentId: a._id,
      title: a.title,
      dueDate: a.dueDate,
      totalMarks: a.totalMarks,
      marks,
      status: sub?.status || "NOT_SUBMITTED",
      percentage,
    };
  });

  const overallPercentage = totalPossibleMarks > 0
    ? Math.round((totalMarksObtained / totalPossibleMarks) * 100)
    : 0;

  const distribution = { excellent: 0, good: 0, average: 0, below: 0, unscored: 0 };
  for (const g of grades) {
    if (g.status === "NOT_SUBMITTED") distribution.unscored++;
    else if (g.percentage >= 80) distribution.excellent++;
    else if (g.percentage >= 60) distribution.good++;
    else if (g.percentage >= 40) distribution.average++;
    else distribution.below++;
  }

  const gradeTrend = grades
    .filter((g) => g.status !== "NOT_SUBMITTED")
    .reverse()
    .map((g) => ({
      title: g.title.length > 15 ? g.title.slice(0, 15) + "..." : g.title,
      percentage: g.percentage,
      marks: g.marks,
      totalMarks: g.totalMarks,
    }));

  return {
    grades,
    summary: { totalMarksObtained, totalPossibleMarks, overallPercentage },
    distribution,
    gradeTrend,
  };
}

export async function changePassword(email: string, currentPassword: string, newPassword: string) {
  await connectDB();

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) throw new ApiError(401, "Incorrect current password");

  const passwordHash = await bcrypt.hash(newPassword, 10);
  user.passwordHash = passwordHash;
  user.mustChangePassword = false;
  await user.save();
}

export async function getTeacherProfile(email: string) {
  await connectDB();
  const user = await User.findOne({ email, role: "teacher" }).lean();
  if (!user) throw new ApiError(404, "Teacher user not found");

  const [classesCount, studentsCount, totalAssignments, totalSessions] = await Promise.all([
    Class.countDocuments(),
    Student.countDocuments(),
    Assignment.countDocuments(),
    AttendanceSession.countDocuments(),
  ]);

  const classes = await Class.find().lean();

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    joinedAt: user.createdAt,
    classesCount,
    studentsCount,
    totalAssignments,
    totalSessions,
    classes: classes.map((c) => ({
      id: String(c._id),
      name: c.name,
      department: c.department,
      batch: c.batch,
      schedule: c.schedule,
    })),
  };
}

export async function updateTeacherProfile(email: string, name: string) {
  await connectDB();
  const user = await User.findOneAndUpdate(
    { email, role: "teacher" },
    { name: name.trim() },
    { new: true }
  ).lean();
  if (!user) throw new ApiError(404, "Teacher user not found");
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
  };
}
