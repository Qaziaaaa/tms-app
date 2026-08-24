import { apiGet, apiPost, apiDelete } from "@/lib/api-client";
import type {
  AttendanceSessionDTO,
  SessionDetailDTO,
  CreateSessionPayload,
  SaveAttendancePayload,
} from "@/types/api";

export function getSessions(classId: string): Promise<AttendanceSessionDTO[]> {
  return apiGet<AttendanceSessionDTO[]>(`/attendance/sessions?classId=${encodeURIComponent(classId)}`);
}

export function getSessionById(id: string): Promise<SessionDetailDTO> {
  return apiGet<SessionDetailDTO>(`/attendance/sessions/${id}`);
}

export function createSession(data: CreateSessionPayload): Promise<AttendanceSessionDTO> {
  return apiPost<AttendanceSessionDTO>("/attendance/sessions", data);
}

export function deleteSession(id: string): Promise<{ deleted: boolean }> {
  return apiDelete<{ deleted: boolean }>(`/attendance/sessions/${id}`);
}

export function saveAttendanceRecords(
  data: SaveAttendancePayload
): Promise<{ saved: number }> {
  return apiPost<{ saved: number }>("/attendance/records", data);
}
