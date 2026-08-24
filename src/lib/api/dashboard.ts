import { apiGet } from "@/lib/api-client";
import type { DashboardDataDTO } from "@/types/api";

export function getDashboard(): Promise<DashboardDataDTO> {
  return apiGet<DashboardDataDTO>("/dashboard");
}
