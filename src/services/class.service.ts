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
  const cls = await Class.findOneAndDelete({ _id: id });
  if (!cls) throw new ApiError(404, "Class not found");
}
