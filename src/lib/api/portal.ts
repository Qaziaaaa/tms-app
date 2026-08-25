import { apiGet, apiPut } from "@/lib/api-client";
import type {
  PortalProfileDTO,
  PortalAttendanceDTO,
  PortalGradesDTO,
  PortalAssignmentsDTO,
} from "@/types/api";

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export function getStudentProfile(): Promise<PortalProfileDTO> {
  return apiGet<PortalProfileDTO>("/student/profile");
}

export function getStudentAttendance(): Promise<PortalAttendanceDTO> {
  return apiGet<PortalAttendanceDTO>("/student/attendance");
}

export function getStudentGrades(): Promise<PortalGradesDTO> {
  return apiGet<PortalGradesDTO>("/student/grades");
}

export function getStudentAssignments(): Promise<PortalAssignmentsDTO> {
  return apiGet<PortalAssignmentsDTO>("/student/assignments");
}

export function changePassword(data: ChangePasswordPayload): Promise<{ updated: boolean }> {
  return apiPut<{ updated: boolean }>("/student/password", data);
}

export function changeTeacherPassword(data: ChangePasswordPayload): Promise<{ updated: boolean }> {
  return apiPut<{ updated: boolean }>("/teacher/password", data);
}
