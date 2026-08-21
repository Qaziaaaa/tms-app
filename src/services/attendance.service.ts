import { connectDB } from "@/lib/db";
import { AttendanceSession, AttendanceRecord } from "@/models";
import { ApiError } from "@/lib/api-utils";

export async function getSessions(classId: string | null) {
  await connectDB();
  const filter: Record<string, unknown> = classId ? { classId } : {};

  const sessions = await AttendanceSession.find(filter)
    .populate("classId", "name")
    .sort({ date: -1 })
    .lean();

  const sessionsWithCount = await Promise.all(
    sessions.map(async (session) => {
      const recordCount = await AttendanceRecord.countDocuments({ sessionId: session._id });
      return { ...session, recordCount };
    })
  );

  return sessionsWithCount;
}

export async function getSessionById(id: string) {
  await connectDB();
  const session = await AttendanceSession.findOne({ _id: id }).populate("classId", "name").lean();
  if (!session) throw new ApiError(404, "Session not found");

  const records = await AttendanceRecord.find({ sessionId: id })
    .populate("studentId", "name rollNumber")
    .lean();

  records.sort((a, b) => {
    const aRoll = (a.studentId as unknown as { rollNumber: number })?.rollNumber ?? 0;
    const bRoll = (b.studentId as unknown as { rollNumber: number })?.rollNumber ?? 0;
    return aRoll - bRoll;
  });

  return { ...session, records };
}

export async function createSession(classId: string, date: Date) {
  await connectDB();
  const existing = await AttendanceSession.findOne({ classId, date });
  if (existing) {
    throw new ApiError(409, "Attendance session already exists for this class and date");
  }
  return AttendanceSession.create({ classId, date });
}

export async function deleteSession(id: string) {
  await connectDB();
  const session = await AttendanceSession.findOneAndDelete({ _id: id });
  if (!session) throw new ApiError(404, "Session not found");
  await AttendanceRecord.deleteMany({ sessionId: id });
}

export async function saveAttendance(sessionId: string, records: { studentId: string; status: "PRESENT" | "ABSENT" }[]) {
  await connectDB();
  const session = await AttendanceSession.findOne({ _id: sessionId });
  if (!session) throw new ApiError(404, "Session not found");

  const upserts = records.map((record) =>
    AttendanceRecord.findOneAndUpdate(
      { sessionId, studentId: record.studentId },
      { status: record.status },
      { upsert: true, new: true }
    )
  );

  await Promise.all(upserts);

  const updatedRecords = await AttendanceRecord.find({ sessionId })
    .populate("studentId", "name rollNumber")
    .lean();

  return { ...session.toObject(), records: updatedRecords };
}
