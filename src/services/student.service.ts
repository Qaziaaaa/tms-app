import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-utils";

export async function getStudents(classId: string | null, page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;
  const where = classId ? { classId } : {};

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: { class: { select: { name: true } } },
      orderBy: { rollNumber: "asc" },
      skip,
      take: pageSize,
    }),
    prisma.student.count({ where }),
  ]);

  return { students, total, page, pageSize };
}

export async function getStudentById(id: string) {
  const student = await prisma.student.findUnique({
    where: { id },
    include: { class: true },
  });
  if (!student) throw new ApiError(404, "Student not found");
  return student;
}

export async function createStudent(data: { rollNumber: string; name: string; classId: string }) {
  return prisma.student.create({ data });
}

export async function updateStudent(id: string, data: { rollNumber?: string; name?: string; classId?: string }) {
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Student not found");
  return prisma.student.update({ where: { id }, data });
}

export async function deleteStudent(id: string) {
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Student not found");
  await prisma.student.delete({ where: { id } });
}

export async function bulkImportStudents(classId: string, students: { rollNumber: string; name: string }[]) {
  let created = 0;
  for (const s of students) {
    try {
      await prisma.student.create({
        data: { rollNumber: s.rollNumber, name: s.name, classId },
      });
      created++;
    } catch {
      // Skip duplicates
    }
  }
  return { created };
}
