import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { asyncHandler, ApiError, sendSuccess } from "@/lib/api-utils";
import { getAttendanceReport, getSubmissionsReport } from "@/services/report.service";

export const GET = asyncHandler(async (request: NextRequest) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const type = searchParams.get("type");

  if (!classId) {
    throw new ApiError(400, "classId is required");
  }
  if (!type || !["attendance", "submissions"].includes(type)) {
    throw new ApiError(400, "type must be 'attendance' or 'submissions'");
  }

  if (type === "attendance") {
    const report = await getAttendanceReport(classId);
    return sendSuccess(report, "Attendance report generated");
  }

  const report = await getSubmissionsReport(classId);
  return sendSuccess(report, "Submissions report generated");
});
