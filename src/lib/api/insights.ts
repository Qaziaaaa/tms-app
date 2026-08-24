import { apiGet } from "@/lib/api-client";
import type { ClassInsightDTO } from "@/types/api";

export function getInsights(classId: string): Promise<ClassInsightDTO> {
  return apiGet<ClassInsightDTO>(`/ai?classId=${encodeURIComponent(classId)}`);
}
