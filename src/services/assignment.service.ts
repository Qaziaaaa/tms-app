import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-utils";

export async function getAssignments(classId: string | null) {
  const where = classId ? { classId } : {};
  return prisma.assignment.findMany({
    where,
    include: { _count: { select: { submissions: true } } },
    orderBy: { dueDate: "desc" },
  });
}

export async function getAssignmentById(id: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      submissions: {
        include: { student: { select: { id: true, name: true, rollNumber: true } } },
        orderBy: { student: { rollNumber: "asc" } },
      },
    },
  });
  if (!assignment) throw new ApiError(404, "Assignment not found");
  return assignment;
}

export async function createAssignment(data: {
  classId: string;
  title: string;
  description?: string;
  dueDate: string;
  totalMarks: number;
}) {
  const { classId, title, description, dueDate, totalMarks } = data;

  const students = await prisma.student.findMany({
    where: { classId },
    select: { id: true },
  });

  return prisma.assignment.create({
    data: {
      classId,
      title,
      description,
      dueDate: new Date(dueDate),
      totalMarks,
      submissions: {
        create: students.map((s) => ({ studentId: s.id, status: "NOT_SUBMITTED" })),
      },
    },
    include: { submissions: true },
  });
}

export async function updateAssignment(id: string, data: {
  classId?: string;
  title?: string;
  description?: string;
  dueDate?: string;
  totalMarks?: number;
}) {
  const existing = await prisma.assignment.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Assignment not found");

  const updateData = data.dueDate
    ? { ...data, dueDate: new Date(data.dueDate) }
    : data;

  return prisma.assignment.update({ where: { id }, data: updateData });
}

export async function deleteAssignment(id: string) {
  const existing = await prisma.assignment.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Assignment not found");
  await prisma.assignment.delete({ where: { id } });
}

export async function saveSubmissions(assignmentId: string, submissions: {
  studentId: string;
  status: "SUBMITTED" | "LATE" | "NOT_SUBMITTED";
  marks?: number | null;
}[]) {
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) throw new ApiError(404, "Assignment not found");

  const upserts = submissions.map((sub) =>
    prisma.assignmentSubmission.upsert({
      where: { assignmentId_studentId: { assignmentId, studentId: sub.studentId } },
      update: { status: sub.status, marks: sub.marks ?? null },
      create: { assignmentId, studentId: sub.studentId, status: sub.status, marks: sub.marks ?? null },
    })
  );

  await Promise.all(upserts);

  return prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { submissions: true },
  });
}
