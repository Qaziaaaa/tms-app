import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { asyncHandler, ApiError, sendSuccess } from "@/lib/api-utils";
import { createClassSchema } from "@/lib/validations";

export const GET = asyncHandler(async (request: NextRequest) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const classes = await prisma.class.findMany({
    include: { _count: { select: { students: true } } },
    orderBy: { createdAt: "desc" },
  });

  return sendSuccess(classes, "Classes retrieved successfully");
});

export const POST = asyncHandler(async (request: NextRequest) => {
  const auth = await requireRole(request, "teacher");
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = createClassSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, "Validation failed", Object.values(parsed.error.flatten().fieldErrors).flat());
  }

  const cls = await prisma.class.create({ data: parsed.data });
  return sendSuccess(cls, "Class created successfully", 201);
});
