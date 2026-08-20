import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { asyncHandler, ApiError, sendSuccess } from "@/lib/api-utils";
import { createStudentSchema } from "@/lib/validations";

export const GET = asyncHandler(async (request: NextRequest) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10) || 20));
  const skip = (page - 1) * pageSize;

  const where = classId ? { classId } : {};

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: { class: { select: { name: true } } },
      orderBy: { rollNumber: "asc" },
      skip,
      take: pageSize,
    }),
    prisma.student.count({ where }),
  ]);

  return sendSuccess({ students, total, page, pageSize }, "Students retrieved successfully");
});

export const POST = asyncHandler(async (request: NextRequest) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = createStudentSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, "Validation failed", Object.values(parsed.error.flatten().fieldErrors).flat());
  }

  const student = await prisma.student.create({ data: parsed.data });
  return sendSuccess(student, "Student created successfully", 201);
});
