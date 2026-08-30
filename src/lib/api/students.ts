import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";
import type {
  StudentDTO,
  StudentListDTO,
  BulkImportResultDTO,
  CreateStudentPayload,
  BulkImportPayload,
} from "@/types/api";

export interface GetStudentsOptions {
  page?: number;
  pageSize?: number;
}

export function getStudents(classId: string, options: GetStudentsOptions = {}): Promise<StudentListDTO> {
  const params = new URLSearchParams({ classId });
  if (options.page) params.set("page", String(options.page));
  if (options.pageSize) params.set("pageSize", String(options.pageSize));
  return apiGet<StudentListDTO>(`/students?${params.toString()}`);
}

export function getStudentById(id: string): Promise<StudentDTO> {
  return apiGet<StudentDTO>(`/students/${id}`);
}

export function createStudent(data: CreateStudentPayload): Promise<StudentDTO & { initialPassword?: string }> {
  return apiPost<StudentDTO & { initialPassword?: string }>("/students", data);
}

export function updateStudent(id: string, data: Partial<CreateStudentPayload>): Promise<StudentDTO> {
  return apiPut<StudentDTO>(`/students/${id}`, data);
}

export function deleteStudent(id: string): Promise<{ deleted: boolean }> {
  return apiDelete<{ deleted: boolean }>(`/students/${id}`);
}

export function importStudents(data: BulkImportPayload): Promise<BulkImportResultDTO> {
  return apiPost<BulkImportResultDTO>("/students/bulk", data);
}
