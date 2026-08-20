import { connectDB } from "@/lib/db";
import { Student } from "@/models";
import { ApiError } from "@/lib/api-utils";

export async function getStudents(classId: string | null, page: number, pageSize: number) {
  await connectDB();
  const filter: Record<string, unknown> = classId ? { classId } : {};
  const skip = (page - 1) * pageSize;

  const [students, total] = await Promise.all([
    Student.find(filter)
      .populate("classId", "name")
      .sort({ rollNumber: "asc" })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    Student.countDocuments(filter),
  ]);

  return { students, total, page, pageSize };
}

export async function getStudentById(id: string) {
  await connectDB();
  const student = await Student.findOne({ _id: id }).populate("classId").lean();
  if (!student) throw new ApiError(404, "Student not found");
  return student;
}

export async function createStudent(data: { rollNumber: string; name: string; classId: string }) {
  await connectDB();
  return Student.create(data);
}

export async function updateStudent(id: string, data: { rollNumber?: string; name?: string; classId?: string }) {
  await connectDB();
  const student = await Student.findOneAndUpdate({ _id: id }, data, { new: true });
  if (!student) throw new ApiError(404, "Student not found");
  return student;
}

export async function deleteStudent(id: string) {
  await connectDB();
  const student = await Student.findOneAndDelete({ _id: id });
  if (!student) throw new ApiError(404, "Student not found");
}

export async function bulkImportStudents(classId: string, students: { rollNumber: string; name: string }[]) {
  await connectDB();
  let created = 0;
  for (const s of students) {
    try {
      await Student.create({ rollNumber: s.rollNumber, name: s.name, classId });
      created++;
    } catch {
      // Skip duplicates
    }
  }
  return { created };
}
