import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { Class, Student } from "@/models";
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
  const { AttendanceRecord, AssignmentSubmission, User } = await import("@/models");
  await mongoose.connection.transaction(async (session) => {
    const student = await Student.findOneAndDelete({ _id: id }, { session });
    if (!student) throw new ApiError(404, "Student not found");

    await AttendanceRecord.deleteMany({ studentId: id }, { session });
    await AssignmentSubmission.deleteMany({ studentId: id }, { session });

    if (student.userId) {
      const linkedUser = await User.findOne({ _id: student.userId }).session(session).lean();
      if (linkedUser?.role === "student") {
        await User.findOneAndDelete({ _id: student.userId }, { session });
      }
    }
  });
}

const BULK_IMPORT_MAX_ROWS = 1000;
export const INITIAL_STUDENT_PASSWORD = "Student@123";

export async function bulkImportStudents(classId: string, students: { rollNumber: string; name: string }[]) {
  await connectDB();
  if (students.length > BULK_IMPORT_MAX_ROWS) {
    throw new ApiError(400, `Bulk import is limited to ${BULK_IMPORT_MAX_ROWS} rows per request`);
  }

  const cls = await Class.findOne({ _id: classId }).lean();
  if (!cls) throw new ApiError(404, "Class not found");

  const { User } = await import("@/models");
  const passwordHash = await bcrypt.hash(INITIAL_STUDENT_PASSWORD, 10);

  let created = 0;
  let skipped = 0;
  const skippedDetails: string[] = [];

  for (const s of students) {
    try {
      const existingUser = await User.findOne({ email: `${s.rollNumber.toLowerCase()}@student.tms.local` }).lean();

      const user =
        existingUser ??
        (await User.create({
          name: s.name,
          email: `${s.rollNumber.toLowerCase()}@student.tms.local`,
          passwordHash,
          role: "student",
        }));

      await Student.create({
        rollNumber: s.rollNumber,
        name: s.name,
        classId,
        userId: String(user._id),
        email: user.email,
      });
      created++;
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error ? (error as { code: number }).code : null;
      if (code === 11000) {
        skipped++;
        skippedDetails.push(s.rollNumber);
      } else if (code === 96) {
        throw new ApiError(400, "Import payload too large — split the CSV into smaller batches");
      } else {
        throw error;
      }
    }
  }

  return {
    created,
    skipped,
    skippedRollNumbers: skippedDetails.slice(0, 20),
    initialPassword: INITIAL_STUDENT_PASSWORD,
  };
}
