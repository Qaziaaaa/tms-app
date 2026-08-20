import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { asyncHandler, ApiError, sendSuccess } from "@/lib/api-utils";
import { saveAttendance } from "@/services/attendance.service";
import { saveAttendanceSchema } from "@/lib/validations";

export const POST = asyncHandler(async (request: NextRequest) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = saveAttendanceSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, "Validation failed", Object.values(parsed.error.flatten().fieldErrors).flat());
  }

  const { sessionId, records } = parsed.data;
  const updated = await saveAttendance(sessionId, records);
  return sendSuccess(updated, "Attendance saved successfully");
});
