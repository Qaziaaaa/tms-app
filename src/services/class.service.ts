import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Class, Student } from "@/models";
import { ApiError } from "@/lib/api-utils";

export async function getClasses() {
  await connectDB();
  const classes = await Class.find().sort({ createdAt: -1 }).lean();

  const classesWithCount = await Promise.all(
    classes.map(async (cls) => {
      const studentCount = await Student.countDocuments({ classId: cls._id });
      return { ...cls, studentCount };
    })
  );

  return classesWithCount;
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
