import { apiGet } from "@/lib/api-client";
import type { ReportDataDTO, ReportType } from "@/types/api";

export function getReport(classId: string, type: ReportType): Promise<ReportDataDTO> {
  return apiGet<ReportDataDTO>(
    `/reports?classId=${encodeURIComponent(classId)}&type=${type}`
  );
}
