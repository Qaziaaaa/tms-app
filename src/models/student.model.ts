import mongoose, { Schema, Document } from "mongoose";

export interface IStudent extends Document {
  userId?: mongoose.Types.ObjectId;
  email?: string;
  rollNumber: string;
  name: string;
  classId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    email: { type: String, default: null, lowercase: true, trim: true },
    rollNumber: { type: String, required: true },
    name: { type: String, required: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
  },
  { timestamps: true }
);

StudentSchema.index({ classId: 1 });
StudentSchema.index({ rollNumber: 1 });
StudentSchema.index({ userId: 1 }, { sparse: true });
StudentSchema.index({ email: 1 }, { sparse: true });
StudentSchema.index({ classId: 1, rollNumber: 1 }, { unique: true });

export const Student = mongoose.models.Student || mongoose.model<IStudent>("Student", StudentSchema);
