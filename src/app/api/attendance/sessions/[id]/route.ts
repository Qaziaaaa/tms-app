import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { asyncHandler, sendSuccess } from "@/lib/api-utils";
import { getSessionById, deleteSession } from "@/services/attendance.service";

export const GET = asyncHandler(async (request: NextRequest, context) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const { id } = await context!.params;
  const session = await getSessionById(id);
  return sendSuccess(session, "Session retrieved successfully");
});

export const DELETE = asyncHandler(async (request: NextRequest, context) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const { id } = await context!.params;
  await deleteSession(id);
  return sendSuccess({ deleted: true }, "Session deleted successfully");
});
