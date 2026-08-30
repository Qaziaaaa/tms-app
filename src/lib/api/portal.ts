import { apiGet, apiPut, apiPost, apiDelete } from "@/lib/api-client";
import type {
  PortalProfileDTO,
  PortalAttendanceDTO,
  PortalGradesDTO,
  PortalAssignmentsDTO,
  SubmissionDTO,
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

export interface TurnInPayload {
  submissionLink?: string;
  submissionNote?: string;
}

export function turnInAssignment(assignmentId: string, data: TurnInPayload): Promise<SubmissionDTO> {
  return apiPost<SubmissionDTO>(`/student/assignments/${assignmentId}`, data);
}

export function unsubmitAssignment(assignmentId: string): Promise<{ id: string; status: string }> {
  return apiDelete<{ id: string; status: string }>(`/student/assignments/${assignmentId}`);
}

export function changePassword(data: ChangePasswordPayload): Promise<{ updated: boolean }> {
  return apiPut<{ updated: boolean }>("/student/password", data);
}

export function changeTeacherPassword(data: ChangePasswordPayload): Promise<{ updated: boolean }> {
  return apiPut<{ updated: boolean }>("/teacher/password", data);
}
