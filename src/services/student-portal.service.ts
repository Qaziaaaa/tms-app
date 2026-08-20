import { connectDB } from "@/lib/db";
import { User, Student, AttendanceSession, AttendanceRecord, Assignment, AssignmentSubmission } from "@/models";
import { ApiError } from "@/lib/api-utils";
import bcrypt from "bcryptjs";

export async function getStudentProfile(userId: string) {
  await connectDB();

  const user = await User.findById(userId).lean();
  if (!user) throw new ApiError(404, "User not found");

  const student = await Student.findOne({ userId }).populate("classId", "name department batch schedule").lean();
  if (!student) throw new ApiError(404, "Student profile not found");

  return {
    id: student._id,
    name: student.name,
    email: user.email,
    rollNumber: student.rollNumber,
    class: student.classId,
  };
}

export async function getStudentAttendance(userId: string) {
  await connectDB();

  const student = await Student.findOne({ userId }).lean();
  if (!student) throw new ApiError(404, "Student not found");

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
  const lateCount = records.filter((r) => r.status === "LATE").length;
  const totalDays = records.length;
  const percentage = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

  return {
    records,
    summary: { present: presentCount, absent: absentCount, late: lateCount, totalDays, percentage },
  };
}

export async function getStudentAssignments(userId: string) {
  await connectDB();

  const student = await Student.findOne({ userId }).lean();
  if (!student) throw new ApiError(404, "Student not found");

  const assignments = await Assignment.find({ classId: student.classId })
    .sort({ dueDate: -1 })
    .lean();

  const submissions = await AssignmentSubmission.find({
    studentId: student._id,
    assignmentId: { $in: assignments.map((a) => a._id) },
  }).lean();

  const submissionMap = new Map(submissions.map((s) => [String(s.assignmentId), s]));

  return assignments.map((a) => ({
    id: a._id,
    title: a.title,
    description: a.description,
    dueDate: a.dueDate,
    totalMarks: a.totalMarks,
    submission: submissionMap.get(String(a._id)) || null,
  }));
}

export async function getStudentGrades(userId: string) {
  await connectDB();

  const student = await Student.findOne({ userId }).lean();
  if (!student) throw new ApiError(404, "Student not found");

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

  return {
    grades,
    summary: { totalMarksObtained, totalPossibleMarks, overallPercentage },
  };
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  await connectDB();

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) throw new ApiError(401, "Incorrect current password");

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await User.findByIdAndUpdate(userId, { passwordHash });
}
