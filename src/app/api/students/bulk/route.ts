import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { asyncHandler, ApiError, sendSuccess } from "@/lib/api-utils";
import { bulkStudentSchema } from "@/lib/validations";

export const POST = asyncHandler(async (request: NextRequest) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = bulkStudentSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, "Validation failed", Object.values(parsed.error.flatten().fieldErrors).flat());
  }

  const { classId, students } = parsed.data;

  let created = 0;
  for (const s of students) {
    try {
      await prisma.student.create({
        data: { rollNumber: s.rollNumber, name: s.name, classId },
      });
      created++;
    } catch {
      // Skip duplicates silently
    }
  }

  return sendSuccess({ created }, "Bulk import completed", 201);
});
