import { connectDB } from "@/lib/db";
import { Student, AttendanceSession, AttendanceRecord, Assignment, AssignmentSubmission, Class } from "@/models";
import { AI_CONFIG } from "@/lib/constants";

async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return JSON.stringify({ error: "GROQ_API_KEY not configured" });
  }

  const res = await fetch(AI_CONFIG.API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: AI_CONFIG.MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an expert academic performance analyst. You receive structured student data and produce a clear, professional JSON report. Output ONLY valid JSON — no markdown fences, no extra text. Be specific, factual, and concise. Never fabricate data.",
        },
        { role: "user", content: prompt },
      ],
      temperature: AI_CONFIG.TEMPERATURE,
      max_tokens: AI_CONFIG.MAX_TOKENS,
    }),
  });

  if (!res.ok) {
    return JSON.stringify({ error: `Groq API error: ${res.status}` });
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || JSON.stringify({ error: "No response from AI" });
}

export interface StudentInsight {
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
  riskScore?: number;
  performance: "high" | "average" | "low";
  aiAnalysis: string;
}

export interface StudentCategory {
  name: string;
  rollNumber: string;
  attendance: number;
  submissionRate: number;
  marks: number;
  brief: string;
}

export interface ClassInsight {
  classId: string;
  className: string;
  totalStudents: number;
  averageAttendance: number;
  averageSubmissionRate: number;
  atRiskStudents: number;
  summary: string;
  recommendations: string[];
  categories: {
    top: StudentCategory[];
    average: StudentCategory[];
    atRisk: StudentCategory[];
  };
  students: StudentInsight[];
}

async function getClassDataForAI(classId: string) {
  await connectDB();

  const cls = await Class.findById(classId).lean();
  if (!cls) return null;

  const students = await Student.find({ classId }).sort({ rollNumber: "asc" }).lean();

  const totalSessions = await AttendanceSession.countDocuments({ classId });
  const assignments = await Assignment.find({ classId }).select("_id totalMarks").lean();
  const totalAssignments = assignments.length;
  const totalPossibleMarks = assignments.reduce((sum, a) => sum + (a.totalMarks ?? 0), 0);
  const assignmentIds = assignments.map((a) => a._id);
  const sessionIds = await AttendanceSession.find({ classId }).select("_id").lean();

  const studentData = await Promise.all(
    students.map(async (student) => {
      const sessionsAttended = await AttendanceRecord.countDocuments({
        studentId: student._id,
        sessionId: { $in: sessionIds.map((s) => s._id) },
        status: "PRESENT",
      });

      const submissions = await AssignmentSubmission.find({
        studentId: student._id,
        assignmentId: { $in: assignmentIds },
      }).lean();

      const graded = submissions.filter(
        (s) => s.status === "SUBMITTED" || s.status === "LATE"
      );

      const submittedCount = graded.length;
      const totalMarksObtained = graded.reduce((sum, s) => sum + (s.marks ?? 0), 0);

      const attendancePercentage = totalSessions > 0 ? Math.round((sessionsAttended / totalSessions) * 100) : 0;
      const submissionRate = totalAssignments > 0 ? Math.round((submittedCount / totalAssignments) * 100) : 0;
      const averageMarks = totalPossibleMarks > 0 ? Math.round((totalMarksObtained / totalPossibleMarks) * 100) : 0;

      return {
        studentId: String(student._id),
        name: student.name,
        rollNumber: student.rollNumber,
        attendancePercentage,
        submissionRate,
        averageMarks,
        totalSessions,
        sessionsAttended,
        totalAssignments,
        assignmentsSubmitted: submittedCount,
      };
    })
  );

  return { cls, students: studentData, totalSessions, totalAssignments };
}

export async function getAIInsights(classId: string): Promise<ClassInsight> {
  const data = await getClassDataForAI(classId);
  if (!data) {
    throw new Error("Class not found");
  }

  const studentsWithRisk = data.students.map((s) => {
    const { ATTENDANCE, SUBMISSION, MARKS } = AI_CONFIG.RISK_WEIGHTS;

    const attendanceDeficit = 100 - s.attendancePercentage;
    const submissionDeficit = 100 - s.submissionRate;
    const marksDeficit = 100 - s.averageMarks;

    const riskScore = Math.round(
      ATTENDANCE * attendanceDeficit +
      SUBMISSION * submissionDeficit +
      MARKS * marksDeficit
    );

    const poorAttendance = s.attendancePercentage < AI_CONFIG.RISK_THRESHOLDS.ATTENDANCE_HIGH;
    const poorSubmission = s.submissionRate < AI_CONFIG.RISK_THRESHOLDS.SUBMISSION_HIGH;
    const poorMarks = s.averageMarks < AI_CONFIG.RISK_THRESHOLDS.MARKS_HIGH;

    let riskLevel: "low" | "medium" | "high" = "low";
    if (riskScore >= AI_CONFIG.RISK_SCORE.HIGH || (poorAttendance && poorMarks) || (poorSubmission && poorMarks)) {
      riskLevel = "high";
    } else if (riskScore >= AI_CONFIG.RISK_SCORE.MEDIUM || (poorAttendance && poorSubmission)) {
      riskLevel = "medium";
    }

    const isHighPerformer =
      s.averageMarks >= AI_CONFIG.PERFORMANCE.HIGH_MARKS &&
      s.submissionRate >= AI_CONFIG.PERFORMANCE.HIGH_SUBMISSION;
    const performance: "high" | "average" | "low" = isHighPerformer
      ? "high"
      : s.averageMarks < AI_CONFIG.PERFORMANCE.HIGH_MARKS ||
          s.submissionRate < AI_CONFIG.PERFORMANCE.HIGH_SUBMISSION
        ? "low"
        : "average";

    return { ...s, riskLevel, riskScore, performance, aiAnalysis: "" };
  });

  const atRiskStudents = studentsWithRisk.filter((s) => s.riskLevel === "high" || s.riskLevel === "medium");

  const avgAttendance = data.students.length > 0
    ? Math.round(data.students.reduce((sum, s) => sum + s.attendancePercentage, 0) / data.students.length)
    : 0;
  const avgSubmission = data.students.length > 0
    ? Math.round(data.students.reduce((sum, s) => sum + s.submissionRate, 0) / data.students.length)
    : 0;

  let categories: { top: StudentCategory[]; average: StudentCategory[]; atRisk: StudentCategory[] } = {
    top: [],
    average: [],
    atRisk: [],
  };
  let summary = "";
  let recommendations: string[] = [];

  try {
    const prompt = `You are analyzing a university class performance. Produce a clear, actionable JSON report.

## Class Info
Name: ${data.cls.name} | Dept: ${data.cls.department} | Batch: ${data.cls.batch}
Total Students: ${data.students.length} | Sessions Held: ${data.totalSessions} | Assignments Given: ${data.totalAssignments}
Class Average Attendance: ${avgAttendance}% | Class Average Submission Rate: ${avgSubmission}%

## Student Data
${JSON.stringify(
  studentsWithRisk.map((s) => ({
    name: s.name,
    roll: s.rollNumber,
    attendance: s.attendancePercentage + "%",
    submissions: `${s.assignmentsSubmitted}/${s.totalAssignments} (${s.submissionRate}%)`,
    marks: s.averageMarks + "%",
    risk: s.riskLevel,
    tier: s.performance,
  })),
  null,
  2
)}

## Instructions
Classify EVERY student into exactly one of three tiers:
1. **top** — Strong attendance (≥75%), high submission rate (≥70%), good marks (≥60%). These are your best students.
2. **average** — Performing acceptably but have gaps. Not failing but not excelling.
3. **atRisk** — Weak attendance (<50%) or very low submission rate (<50%) or poor marks (<40%). These need immediate attention.

For each student, write a 1-line brief (10-15 words) summarizing their status. Be specific: mention the exact metric that matters.

Return ONLY this JSON:
{
  "summary": "3-4 sentence overview of class health — mention overall attendance, submission trends, and how many students need attention. Be direct and factual.",
  "categories": {
    "top": [
      { "name": "...", "roll": "...", "attendance": 85, "submissionRate": 90, "marks": 72, "brief": "Excellent attendance and consistent submission. Strong performer." }
    ],
    "average": [
      { "name": "...", "roll": "...", "attendance": 60, "submissionRate": 55, "marks": 48, "brief": "Moderate attendance. Needs to improve submission consistency." }
    ],
    "atRisk": [
      { "name": "...", "roll": "...", "attendance": 30, "submissionRate": 20, "marks": 15, "brief": "Critical: very low attendance and submissions. Immediate intervention needed." }
    ]
  },
  "recommendations": [
    "Specific actionable recommendation 1",
    "Specific actionable recommendation 2",
    "Specific actionable recommendation 3"
  ]
}`;

    const response = await callGroq(prompt);

    let parsed: Record<string, unknown> = {};
    try {
      const cleaned = response.replace(/```json|```/g, "").trim();
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      parsed = JSON.parse(cleaned.slice(start >= 0 ? start : 0, end >= 0 ? end + 1 : undefined));
    } catch {
      parsed = {};
    }

    summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
    recommendations = Array.isArray(parsed.recommendations)
      ? parsed.recommendations.filter((r: unknown): r is string => typeof r === "string").map((r) => r.trim()).filter(Boolean)
      : [];

    if (parsed.categories && typeof parsed.categories === "object") {
      const cat = parsed.categories as Record<string, unknown[]>;
      const mapCategory = (items: unknown[]): StudentCategory[] =>
        items
          .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
          .map((item) => ({
            name: String(item.name ?? item.name ?? ""),
            rollNumber: String(item.roll ?? item.rollNumber ?? ""),
            attendance: Number(item.attendance ?? 0),
            submissionRate: Number(item.submissionRate ?? 0),
            marks: Number(item.marks ?? 0),
            brief: String(item.brief ?? ""),
          }))
          .filter((s) => s.name || s.rollNumber);

      categories = {
        top: mapCategory(cat.top ?? []),
        average: mapCategory(cat.average ?? []),
        atRisk: mapCategory(cat.atRisk ?? []),
      };
    }
  } catch {
    summary = "AI analysis unavailable. Configure GROQ_API_KEY in .env to enable.";
  }

  // Fallback: if AI didn't categorize, do it ourselves
  if (categories.top.length === 0 && categories.average.length === 0 && categories.atRisk.length === 0) {
    categories = {
      top: studentsWithRisk
        .filter((s) => s.performance === "high")
        .map((s) => ({
          name: s.name,
          rollNumber: s.rollNumber,
          attendance: s.attendancePercentage,
          submissionRate: s.submissionRate,
          marks: s.averageMarks,
          brief: `Attends ${s.attendancePercentage}% classes, submits ${s.submissionRate}% assignments.`,
        })),
      average: studentsWithRisk
        .filter((s) => s.performance === "average")
        .map((s) => ({
          name: s.name,
          rollNumber: s.rollNumber,
          attendance: s.attendancePercentage,
          submissionRate: s.submissionRate,
          marks: s.averageMarks,
          brief: `Moderate performer. Attendance ${s.attendancePercentage}%, marks ${s.averageMarks}%.`,
        })),
      atRisk: studentsWithRisk
        .filter((s) => s.riskLevel === "high" || s.riskLevel === "medium")
        .map((s) => ({
          name: s.name,
          rollNumber: s.rollNumber,
          attendance: s.attendancePercentage,
          submissionRate: s.submissionRate,
          marks: s.averageMarks,
          brief: `Needs attention. Attendance ${s.attendancePercentage}%, marks ${s.averageMarks}%.`,
        })),
    };
  }

  return {
    classId: String(data.cls._id),
    className: data.cls.name,
    totalStudents: data.students.length,
    averageAttendance: avgAttendance,
    averageSubmissionRate: avgSubmission,
    atRiskStudents: atRiskStudents.length,
    summary,
    recommendations,
    categories,
    students: studentsWithRisk,
  };
}
