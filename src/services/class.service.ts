import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-utils";

export async function getClasses() {
  return prisma.class.findMany({
    include: { _count: { select: { students: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getClassById(id: string) {
  const cls = await prisma.class.findUnique({
    where: { id },
    include: { students: { orderBy: { rollNumber: "asc" } } },
  });
  if (!cls) throw new ApiError(404, "Class not found");
  return cls;
}

export async function createClass(data: {
  name: string;
  department: string;
  batch: string;
  schedule?: string;
}) {
  return prisma.class.create({ data });
}

export async function updateClass(id: string, data: {
  name?: string;
  department?: string;
  batch?: string;
  schedule?: string;
}) {
  const existing = await prisma.class.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Class not found");
  return prisma.class.update({ where: { id }, data });
}

export async function deleteClass(id: string) {
  const existing = await prisma.class.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Class not found");
  await prisma.class.delete({ where: { id } });
}
