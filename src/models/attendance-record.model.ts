import mongoose, { Schema, Document } from "mongoose";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";

export interface IAttendanceRecord extends Document {
  sessionId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  status: AttendanceStatus;
}

const AttendanceRecordSchema = new Schema<IAttendanceRecord>({
  sessionId: { type: Schema.Types.ObjectId, ref: "AttendanceSession", required: true },
  studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
  status: { type: String, enum: ["PRESENT", "ABSENT", "LATE"], required: true },
});

AttendanceRecordSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });
AttendanceRecordSchema.index({ sessionId: 1 });
AttendanceRecordSchema.index({ studentId: 1 });
AttendanceRecordSchema.index({ status: 1 });

export const AttendanceRecord =
  mongoose.models.AttendanceRecord ||
  mongoose.model<IAttendanceRecord>("AttendanceRecord", AttendanceRecordSchema);
