import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { asyncHandler, ApiError, sendSuccess } from "@/lib/api-utils";
import { createAssignmentSchema } from "@/lib/validations";

export const GET = asyncHandler(async (request: NextRequest) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");

  const where = classId ? { classId } : {};

  const assignments = await prisma.assignment.findMany({
    where,
    include: { _count: { select: { submissions: true } } },
    orderBy: { dueDate: "desc" },
  });

  return sendSuccess(assignments, "Assignments retrieved successfully");
});

export const POST = asyncHandler(async (request: NextRequest) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = createAssignmentSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, "Validation failed", Object.values(parsed.error.flatten().fieldErrors).flat());
  }

  const { classId, title, description, dueDate, totalMarks } = parsed.data;

  const students = await prisma.student.findMany({
    where: { classId },
    select: { id: true },
  });

  const assignment = await prisma.assignment.create({
    data: {
      classId,
      title,
      description,
      dueDate: new Date(dueDate),
      totalMarks,
      submissions: {
        create: students.map((s) => ({ studentId: s.id, status: "NOT_SUBMITTED" })),
      },
    },
    include: { submissions: true },
  });

  return sendSuccess(assignment, "Assignment created successfully", 201);
});
