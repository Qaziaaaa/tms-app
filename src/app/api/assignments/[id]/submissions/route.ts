import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { asyncHandler, ApiError, sendSuccess } from "@/lib/api-utils";
import { saveSubmissionsSchema } from "@/lib/validations";

export const POST = asyncHandler(async (request: NextRequest, context) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const { id: assignmentId } = await context!.params;
  const body = await request.json();
  const parsed = saveSubmissionsSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, "Validation failed", Object.values(parsed.error.flatten().fieldErrors).flat());
  }

  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) {
    throw new ApiError(404, "Assignment not found");
  }

  const { submissions } = parsed.data;

  const upserts = submissions.map((sub) =>
    prisma.assignmentSubmission.upsert({
      where: { assignmentId_studentId: { assignmentId, studentId: sub.studentId } },
      update: { status: sub.status, marks: sub.marks ?? null },
      create: { assignmentId, studentId: sub.studentId, status: sub.status, marks: sub.marks ?? null },
    })
  );

  await Promise.all(upserts);

  const updated = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { submissions: true },
  });

  return sendSuccess(updated, "Submissions saved successfully");
});
