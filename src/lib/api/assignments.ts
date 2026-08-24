import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";
import type {
  AssignmentDTO,
  AssignmentDetailDTO,
  CreateAssignmentPayload,
  UpdateAssignmentPayload,
  SaveSubmissionsInput,
} from "@/types/api";

export function getAssignments(classId: string): Promise<AssignmentDTO[]> {
  return apiGet<AssignmentDTO[]>(`/assignments?classId=${encodeURIComponent(classId)}`);
}

export function getAssignmentById(id: string): Promise<AssignmentDetailDTO> {
  return apiGet<AssignmentDetailDTO>(`/assignments/${id}`);
}

export function createAssignment(data: CreateAssignmentPayload): Promise<AssignmentDTO> {
  return apiPost<AssignmentDTO>("/assignments", data);
}

export function updateAssignment(id: string, data: UpdateAssignmentPayload): Promise<AssignmentDTO> {
  return apiPut<AssignmentDTO>(`/assignments/${id}`, data);
}

export function deleteAssignment(id: string): Promise<{ deleted: boolean }> {
  return apiDelete<{ deleted: boolean }>(`/assignments/${id}`);
}

export function saveSubmissions(
  assignmentId: string,
  data: SaveSubmissionsInput
): Promise<{ saved: number }> {
  return apiPost<{ saved: number }>(`/assignments/${assignmentId}/submissions`, data);
}
