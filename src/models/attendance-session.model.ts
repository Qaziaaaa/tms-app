import mongoose, { Schema, Document } from "mongoose";

export interface IAttendanceSession extends Document {
  classId: mongoose.Types.ObjectId;
  dateKey: string;
  date: Date;
  createdAt: Date;
}

const AttendanceSessionSchema = new Schema<IAttendanceSession>(
  {
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    dateKey: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    date: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AttendanceSessionSchema.index({ classId: 1, dateKey: 1 }, { unique: true });
AttendanceSessionSchema.index({ classId: 1 });
AttendanceSessionSchema.index({ date: 1 });

export const AttendanceSession =
  mongoose.models.AttendanceSession ||
  mongoose.model<IAttendanceSession>("AttendanceSession", AttendanceSessionSchema);
