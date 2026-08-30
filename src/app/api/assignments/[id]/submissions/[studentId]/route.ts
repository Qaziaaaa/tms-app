import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { asyncHandler, ApiError, sendSuccess } from "@/lib/api-utils";
import { reviewSubmission } from "@/services/assignment.service";
import { z } from "zod";

const reviewSchema = z.object({
  action: z.enum(["accept", "reject"]),
  marks: z.coerce.number().int().min(0).optional().nullable(),
});

export const PATCH = asyncHandler(async (request: NextRequest, context) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const { id: assignmentId, studentId } = await context!.params;
  const body = await request.json().catch(() => ({}));
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, "Validation failed", Object.values(parsed.error.flatten().fieldErrors).flat());
  }

  const updated = await reviewSubmission(assignmentId, studentId, parsed.data.action, parsed.data.marks);
  return sendSuccess(updated, parsed.data.action === "accept" ? "Submission accepted" : "Submission rejected");
});
