import mongoose, { Schema, Document } from "mongoose";

export interface IAssignment extends Document {
  classId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  dueDate: Date;
  totalMarks: number;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    title: { type: String, required: true },
    description: { type: String },
    dueDate: { type: Date, required: true },
    totalMarks: { type: Number, required: true },
  },
  { timestamps: true }
);

AssignmentSchema.index({ classId: 1 });
AssignmentSchema.index({ dueDate: 1 });

export const Assignment =
  mongoose.models.Assignment || mongoose.model<IAssignment>("Assignment", AssignmentSchema);
