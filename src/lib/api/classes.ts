import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";
import type { ClassDTO, CreateClassPayload, UpdateClassPayload } from "@/types/api";

export function getClasses(): Promise<ClassDTO[]> {
  return apiGet<ClassDTO[]>("/classes");
}

export function getClassById(id: string): Promise<ClassDTO> {
  return apiGet<ClassDTO>(`/classes/${id}`);
}

export function createClass(data: CreateClassPayload): Promise<ClassDTO> {
  return apiPost<ClassDTO>("/classes", data);
}

export function updateClass(id: string, data: UpdateClassPayload): Promise<ClassDTO> {
  return apiPut<ClassDTO>(`/classes/${id}`, data);
}

export function deleteClass(id: string): Promise<{ deleted: boolean }> {
  return apiDelete<{ deleted: boolean }>(`/classes/${id}`);
}
