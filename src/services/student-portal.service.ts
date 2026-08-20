import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-utils";
import bcrypt from "bcryptjs";

export async function getStudentProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");

  const student = await prisma.student.findFirst({
    where: { userId },
    include: { class: { select: { id: true, name: true, department: true, batch: true, schedule: true } } },
  });
  if (!student) throw new ApiError(404, "Student profile not found");

  return {
    id: student.id,
    name: student.name,
    email: user.email,
    rollNumber: student.rollNumber,
    class: student.class,
  };
}

export async function getStudentAttendance(userId: string) {
  const student = await prisma.student.findFirst({ where: { userId } });
  if (!student) throw new ApiError(404, "Student not found");

  const records = await prisma.attendanceRecord.findMany({
    where: { studentId: student.id },
    include: {
      session: {
        select: { id: true, date: true, class: { select: { name: true } } },
      },
    },
    orderBy: { session: { date: "desc" } },
  });

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
  const student = await prisma.student.findFirst({ where: { userId } });
  if (!student) throw new ApiError(404, "Student not found");

  const assignments = await prisma.assignment.findMany({
    where: { classId: student.classId },
    include: {
      submissions: {
        where: { studentId: student.id },
        select: { id: true, status: true, marks: true },
      },
    },
    orderBy: { dueDate: "desc" },
  });

  return assignments.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    dueDate: a.dueDate,
    totalMarks: a.totalMarks,
    submission: a.submissions[0] || null,
  }));
}

export async function getStudentGrades(userId: string) {
  const student = await prisma.student.findFirst({ where: { userId } });
  if (!student) throw new ApiError(404, "Student not found");

  const assignments = await prisma.assignment.findMany({
    where: { classId: student.classId },
    orderBy: { dueDate: "desc" },
  });

  const submissions = await prisma.assignmentSubmission.findMany({
    where: { studentId: student.id },
  });

  const submissionMap = new Map(submissions.map((s) => [s.assignmentId, s]));

  let totalMarksObtained = 0;
  let totalPossibleMarks = 0;

  const grades = assignments.map((a) => {
    const sub = submissionMap.get(a.id);
    const marks = sub?.marks ?? 0;
    totalMarksObtained += marks;
    totalPossibleMarks += a.totalMarks;

    const percentage = a.totalMarks > 0 ? Math.round((marks / a.totalMarks) * 100) : 0;

    return {
      assignmentId: a.id,
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
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) throw new ApiError(401, "Incorrect current password");

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}
