import { connectDB } from "@/lib/db";
import { Assignment, AssignmentSubmission, Student } from "@/models";
import { ApiError } from "@/lib/api-utils";

export async function getAssignments(classId: string | null) {
  await connectDB();
  const filter: Record<string, unknown> = classId ? { classId } : {};

  const assignments = await Assignment.find(filter).sort({ dueDate: -1 }).lean();

  const assignmentsWithCount = await Promise.all(
    assignments.map(async (a) => {
      const submissionCount = await AssignmentSubmission.countDocuments({ assignmentId: a._id });
      return { ...a, submissionCount };
    })
  );

  return assignmentsWithCount;
}

export async function getAssignmentById(id: string) {
  await connectDB();
  const assignment = await Assignment.findById(id).lean();
  if (!assignment) throw new ApiError(404, "Assignment not found");

  const submissions = await AssignmentSubmission.find({ assignmentId: id })
    .populate("studentId", "name rollNumber")
    .sort({ "studentId.rollNumber": "asc" })
    .lean();

  return { ...assignment, submissions };
}

export async function createAssignment(data: {
  classId: string;
  title: string;
  description?: string;
  dueDate: string;
  totalMarks: number;
}) {
  await connectDB();
  const { classId, title, description, dueDate, totalMarks } = data;

  const assignment = await Assignment.create({
    classId,
    title,
    description,
    dueDate: new Date(dueDate),
    totalMarks,
  });

  const students = await Student.find({ classId }).select("_id").lean();

  if (students.length > 0) {
    await AssignmentSubmission.insertMany(
      students.map((s) => ({
        assignmentId: assignment._id,
        studentId: s._id,
        status: "NOT_SUBMITTED",
      }))
    );
  }

  const submissions = await AssignmentSubmission.find({ assignmentId: assignment._id }).lean();
  return { ...assignment.toObject(), submissions };
}

export async function updateAssignment(id: string, data: {
  classId?: string;
  title?: string;
  description?: string;
  dueDate?: string;
  totalMarks?: number;
}) {
  await connectDB();
  const updateData = { ...data };
  if (updateData.dueDate) {
    (updateData as Record<string, unknown>).dueDate = new Date(updateData.dueDate);
  }

  const assignment = await Assignment.findByIdAndUpdate(id, updateData, { new: true });
  if (!assignment) throw new ApiError(404, "Assignment not found");
  return assignment;
}

export async function deleteAssignment(id: string) {
  await connectDB();
  const assignment = await Assignment.findByIdAndDelete(id);
  if (!assignment) throw new ApiError(404, "Assignment not found");
  await AssignmentSubmission.deleteMany({ assignmentId: id });
}

export async function saveSubmissions(assignmentId: string, submissions: {
  studentId: string;
  status: "SUBMITTED" | "LATE" | "NOT_SUBMITTED";
  marks?: number | null;
}[]) {
  await connectDB();
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new ApiError(404, "Assignment not found");

  const upserts = submissions.map((sub) =>
    AssignmentSubmission.findOneAndUpdate(
      { assignmentId, studentId: sub.studentId },
      { status: sub.status, marks: sub.marks ?? null },
      { upsert: true, new: true }
    )
  );

  await Promise.all(upserts);

  const updatedSubmissions = await AssignmentSubmission.find({ assignmentId })
    .populate("studentId", "name rollNumber")
    .lean();

  return { ...assignment.toObject(), submissions: updatedSubmissions };
}
