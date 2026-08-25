import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { asyncHandler, sendSuccess } from "@/lib/api-utils";
import { getDashboard } from "@/services/dashboard.service";

export const GET = asyncHandler(async (request: NextRequest) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const data = await getDashboard();
  return sendSuccess(data, "Dashboard data retrieved successfully");
});
