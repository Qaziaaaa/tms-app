import mongoose, { Schema, Document } from "mongoose";

export type SubmissionStatus = "SUBMITTED" | "LATE" | "NOT_SUBMITTED";

export interface IAssignmentSubmission extends Document {
  assignmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  status: SubmissionStatus;
  marks?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSubmissionSchema = new Schema<IAssignmentSubmission>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: "Assignment", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    status: {
      type: String,
      enum: ["SUBMITTED", "LATE", "NOT_SUBMITTED"],
      default: "NOT_SUBMITTED",
    },
    marks: { type: Number },
  },
  { timestamps: true }
);

AssignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
AssignmentSubmissionSchema.index({ assignmentId: 1 });
AssignmentSubmissionSchema.index({ studentId: 1 });
AssignmentSubmissionSchema.index({ status: 1 });

export const AssignmentSubmission =
  mongoose.models.AssignmentSubmission ||
  mongoose.model<IAssignmentSubmission>("AssignmentSubmission", AssignmentSubmissionSchema);
