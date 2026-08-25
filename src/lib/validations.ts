import { z } from "zod";

export const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required").max(100),
  department: z.string().min(1, "Department is required").max(100),
  batch: z.string().min(1, "Batch is required").max(20),
  schedule: z.string().max(100).optional(),
});

export const updateClassSchema = createClassSchema.partial();

export const createStudentSchema = z.object({
  rollNumber: z.string().min(1, "Roll number is required").max(20),
  name: z.string().min(1, "Name is required").max(100),
  classId: z.string().min(1, "Class is required"),
});

export const bulkStudentSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  students: z.array(z.object({
    rollNumber: z.string().min(1),
    name: z.string().min(1),
  })).min(1, "At least one student required"),
});

export const createAttendanceSessionSchema = z.object({
  classId: z.string().min(1),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dateKey must be YYYY-MM-DD"),
});

export const attendanceRecordSchema = z.object({
  studentId: z.string().min(1),
  status: z.enum(["PRESENT", "ABSENT"]),
});

export const saveAttendanceSchema = z.object({
  sessionId: z.string().min(1),
  records: z.array(attendanceRecordSchema).min(1),
});

export const createAssignmentSchema = z.object({
  classId: z.string().min(1),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
  totalMarks: z.number().int().min(1, "Min 1 mark"),
});

export const updateAssignmentSchema = createAssignmentSchema.partial();

export const submissionRecordSchema = z.object({
  studentId: z.string().min(1),
  status: z.enum(["SUBMITTED", "LATE", "NOT_SUBMITTED"]),
  marks: z.number().int().min(0).optional().nullable(),
});

export const saveSubmissionsSchema = z.object({
  submissions: z.array(submissionRecordSchema).min(1),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type BulkStudentInput = z.infer<typeof bulkStudentSchema>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type SaveSubmissionsInput = z.infer<typeof saveSubmissionsSchema>;
