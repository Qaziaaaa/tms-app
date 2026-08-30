import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Assignment, AssignmentSubmission, Student } from "@/models";
import { ApiError } from "@/lib/api-utils";

function toClientSubmission(sub: Record<string, unknown>) {
  const populated = sub.studentId as unknown as
    | { _id?: unknown; id?: unknown; name?: string; rollNumber?: string }
    | null
    | undefined;

  const { _id, id, name, rollNumber } = populated ?? {};

  return {
    ...sub,
    studentId: id != null ? String(id) : _id != null ? String(_id) : undefined,
    student: {
      id: id != null ? String(id) : _id != null ? String(_id) : undefined,
      name: name ?? "",
      rollNumber: rollNumber ?? "",
    },
    submissionLink: sub.submissionLink ? String(sub.submissionLink) : null,
    submissionNote: sub.submissionNote ? String(sub.submissionNote) : null,
    submittedAt: sub.submittedAt ? String(sub.submittedAt) : null,
    reviewedAt: sub.reviewedAt ? String(sub.reviewedAt) : null,
  };
}

export async function getAssignments(classId: string | null) {
  await connectDB();
  const filter: Record<string, unknown> = classId ? { classId } : {};

  const assignments = await Assignment.find(filter).sort({ dueDate: -1 }).lean();

  const assignmentsWithCount = await Promise.all(
    assignments.map(async (a) => {
      const [submissionCount, awaitingReviewCount] = await Promise.all([
        AssignmentSubmission.countDocuments({ assignmentId: a._id }),
        AssignmentSubmission.countDocuments({ assignmentId: a._id, status: "TURNED_IN" }),
      ]);
      return { ...a, submissionCount, awaitingReviewCount };
    })
  );

  return assignmentsWithCount;
}

export async function getAssignmentById(id: string) {
  await connectDB();
  const assignment = await Assignment.findOne({ _id: id }).lean();
  if (!assignment) throw new ApiError(404, "Assignment not found");

  const submissions = await AssignmentSubmission.find({ assignmentId: id })
    .populate("studentId", "name rollNumber")
    .lean();

  submissions.sort((a, b) => {
    const aRoll = (a.studentId as unknown as { rollNumber?: string })?.rollNumber ?? "0";
    const bRoll = (b.studentId as unknown as { rollNumber?: string })?.rollNumber ?? "0";
    return String(aRoll).localeCompare(String(bRoll), undefined, { numeric: true });
  });

  return { ...assignment, submissions: submissions.map(toClientSubmission) };
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

  const assignment = await Assignment.findOneAndUpdate({ _id: id }, updateData, { new: true });
  if (!assignment) throw new ApiError(404, "Assignment not found");
  return assignment;
}

export async function deleteAssignment(id: string) {
  await connectDB();
  await mongoose.connection.transaction(async (session) => {
    const assignment = await Assignment.findOneAndDelete({ _id: id }, { session });
    if (!assignment) throw new ApiError(404, "Assignment not found");
    await AssignmentSubmission.deleteMany({ assignmentId: id }, { session });
  });
}

export async function saveSubmissions(assignmentId: string, submissions: {
  studentId: string;
  status: "SUBMITTED" | "LATE" | "NOT_SUBMITTED" | "TURNED_IN";
  marks?: number | null;
}[]) {
  await connectDB();
  const assignment = await Assignment.findOne({ _id: assignmentId });
  if (!assignment) throw new ApiError(404, "Assignment not found");

  const invalid = submissions.find(
    (sub) => (sub.status === "NOT_SUBMITTED" || sub.status === "TURNED_IN") && sub.marks != null
  );
  if (invalid) {
    throw new ApiError(422, "Marks cannot be assigned until the submission is marked as Submitted or Late");
  }

  const upserts = submissions.map((sub) =>
    AssignmentSubmission.findOneAndUpdate(
      { assignmentId, studentId: sub.studentId },
      {
        status: sub.status,
        marks: sub.status === "NOT_SUBMITTED" || sub.status === "TURNED_IN" ? null : sub.marks ?? null,
        reviewedAt:
          sub.status === "SUBMITTED" || sub.status === "LATE" ? new Date() : undefined,
      },
      { upsert: true, new: true }
    )
  );

  await Promise.all(upserts);

  const updatedSubmissions = await AssignmentSubmission.find({ assignmentId })
    .populate("studentId", "name rollNumber")
    .lean();

  return { ...assignment.toObject(), submissions: updatedSubmissions.map(toClientSubmission) };
}

export async function reviewSubmission(
  assignmentId: string,
  studentId: string,
  action: "accept" | "reject",
  marks?: number | null
) {
  await connectDB();
  const assignment = await Assignment.findOne({ _id: assignmentId });
  if (!assignment) throw new ApiError(404, "Assignment not found");

  const submission = await AssignmentSubmission.findOne({ assignmentId, studentId });
  if (!submission) throw new ApiError(404, "Submission not found");
  if (submission.status !== "TURNED_IN") {
    throw new ApiError(409, "Only submissions awaiting review can be reviewed");
  }

  if (action === "accept") {
    if (marks != null && (marks < 0 || marks > assignment.totalMarks)) {
      throw new ApiError(422, `Marks must be between 0 and ${assignment.totalMarks}`);
    }
    const isLate = new Date(assignment.dueDate) < new Date();
    submission.status = isLate ? "LATE" : "SUBMITTED";
    submission.marks = marks;
  } else {
    submission.status = "NOT_SUBMITTED";
    submission.marks = null;
    submission.submittedAt = undefined;
  }
  submission.reviewedAt = new Date();
  await submission.save();

  const updated = await AssignmentSubmission.findById(submission._id)
    .populate("studentId", "name rollNumber")
    .lean();

  return { ...assignment.toObject(), submissions: ([] as unknown[]).concat(toClientSubmission(updated)) };
}
