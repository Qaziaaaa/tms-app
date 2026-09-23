import { AttendanceRecord, AttendanceSession } from "@/models";

export async function getRecordedSessionIds(classId: string): Promise<unknown[]> {
  const sessionIds = (await AttendanceSession.find({ classId }).select("_id").lean()).map((s) => s._id);
  return AttendanceRecord.distinct("sessionId", { sessionId: { $in: sessionIds } });
}