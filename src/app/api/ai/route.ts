import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { asyncHandler, ApiError, sendSuccess } from "@/lib/api-utils";
import { getAIInsights } from "@/services/ai";

export const GET = asyncHandler(async (request: NextRequest) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  if (!classId) {
    throw new ApiError(400, "classId is required");
  }

  const insights = await getAIInsights(classId);
  return sendSuccess(insights, "AI insights generated successfully");
});
