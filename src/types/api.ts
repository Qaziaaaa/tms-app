import type {
  CreateClassInput,
  CreateStudentInput,
  BulkStudentInput,
  CreateAssignmentInput,
  SaveSubmissionsInput,
} from "@/lib/validations";

export type { SaveSubmissionsInput };

export interface ClassDTO {
  id: string;
  name: string;
  department: string;
  batch: string;
  schedule?: string | null;
  studentCount?: number;
  sessionCount?: number;
  averageAttendance?: number;
}

export interface StudentDTO {
  id: string;
  rollNumber: string;
  name: string;
  classId?: string;
  email?: string | null;
}

export interface StudentListDTO {
  students: StudentDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BulkImportResultDTO {
  created: number;
  skipped: number;
  skippedRollNumbers?: string[];
  initialPassword?: string;
}

export interface AttendanceSessionDTO {
  id: string;
  dateKey: string;
  date: string;
  recordCount?: number;
}

export interface SessionDetailDTO extends AttendanceSessionDTO {
  records: { studentId: string; status: "PRESENT" | "ABSENT" }[];
}

export interface AssignmentDTO {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  totalMarks: number;
  submissionCount?: number;
}

export interface SubmissionDTO {
  id: string;
  studentId: string;
  status: string;
  marks: number | null;
  student: { id: string; name: string; rollNumber: string };
}

export interface AssignmentDetailDTO extends AssignmentDTO {
  submissions: SubmissionDTO[];
}

export interface RecentAttendanceItem {
  id: string;
  date: string;
  classId: { name: string };
  recordCount: number;
  presentCount: number;
}

export interface ClassStatsItem {
  id: string;
  name: string;
  department: string;
  studentCount: number;
  sessionCount: number;
  averageAttendance: number;
}

export interface ClassDetailDTO {
  class: ClassDTO;
  totalStudents: number;
  totalSessions: number;
  averageAttendance: number;
  averageMarks: number;
  totalAssignments: number;
  recentSessions: { id: string; dateKey: string; date: string; presentCount: number; recordCount: number }[];
  recentAssignments: { id: string; title: string; dueDate: string; totalMarks: number; submissionCount: number }[];
  students: { id: string; rollNumber: string; name: string; attendancePct: number; avgMarks: number }[];
}

export interface DashboardDataDTO {
  totalClasses: number;
  totalStudents: number;
  totalSessions: number;
  totalAssignments: number;
  todayAttendance: { present: number; absent: number };
  recentAttendance: RecentAttendanceItem[];
  recentStudents?: { id: string; name: string; email: string; classId?: { name: string } }[];
  classesWithStats: ClassStatsItem[];
}

export type ReportType = "attendance" | "submissions";

export interface AttendanceReportRow {
  id: string;
  rollNumber: string;
  name: string;
  totalSessions: number;
  presentCount: number;
  attendancePercentage: number;
}

export interface SubmissionReportRow {
  id: string;
  rollNumber: string;
  name: string;
  totalAssignments: number;
  submittedCount: number;
  notSubmittedCount: number;
  averageMarks: number;
}

export type ReportDataDTO =
  | { type: "attendance"; classId: string; totalSessions: number; students: AttendanceReportRow[] }
  | { type: "submissions"; classId: string; totalAssignments: number; students: SubmissionReportRow[] };

export interface StudentInsightDTO {
  studentId: string;
  name: string;
  rollNumber: string;
  attendancePercentage: number;
  submissionRate: number;
  averageMarks: number;
  totalSessions: number;
  sessionsAttended: number;
  totalAssignments: number;
  assignmentsSubmitted: number;
  riskLevel: "low" | "medium" | "high";
  aiAnalysis: string;
}

export interface ClassInsightDTO {
  classId: string;
  className: string;
  totalStudents: number;
  averageAttendance: number;
  averageSubmissionRate: number;
  atRiskStudents: number;
  cramStudents: StudentInsightDTO[];
  students: StudentInsightDTO[];
}

export interface PortalProfileDTO {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  class: { id: string; name: string; department: string; batch: string };
}

export interface PortalAttendanceDTO {
  records: { id: string; status: string; session: { id: string; date: string; class: { name: string } } }[];
  summary: { present: number; absent: number; totalDays: number; percentage: number };
  monthlyBreakdown: { month: string; present: number; absent: number; total: number }[];
  recentSessions: { date: string; status: string; className: string }[];
  streak: { current: number; longest: number };
}

export interface PortalGradesDTO {
  grades: {
    assignmentId: string;
    title: string;
    dueDate: string;
    totalMarks: number;
    marks: number;
    status: string;
    percentage: number;
  }[];
  summary: { totalMarksObtained: number; totalPossibleMarks: number; overallPercentage: number };
  distribution: { excellent: number; good: number; average: number; below: number; unscored: number };
  gradeTrend: { title: string; percentage: number; marks: number; totalMarks: number }[];
}

export interface PortalAssignmentsDTO {
  assignments: {
    id: string;
    title: string;
    description: string | null;
    dueDate: string;
    totalMarks: number;
    submission: { id: string; status: string; marks: number | null } | null;
    isOverdue: boolean;
  }[];
  summary: { total: number; submitted: number; pending: number; overdue: number };
  upcoming: { id: string; title: string; dueDate: string; totalMarks: number }[];
}

export type CreateClassPayload = CreateClassInput;
export type UpdateClassPayload = Partial<CreateClassInput>;
export type CreateStudentPayload = Omit<CreateStudentInput, never>;
export type BulkImportPayload = BulkStudentInput;
export type CreateAssignmentPayload = CreateAssignmentInput;
export type UpdateAssignmentPayload = Partial<CreateAssignmentInput>;
export type SaveSubmissionsPayload = SaveSubmissionsInput;

export interface CreateSessionPayload {
  classId: string;
  dateKey: string;
}

export interface SaveAttendancePayload {
  sessionId: string;
  records: { studentId: string; status: "PRESENT" | "ABSENT" }[];
}
