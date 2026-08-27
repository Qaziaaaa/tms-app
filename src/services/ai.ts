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
          content: "You are an academic analytics assistant. Analyze student data and return JSON responses only. No markdown, no explanations outside JSON.",
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

export interface ClassInsight {
  classId: string;
  className: string;
  totalStudents: number;
  averageAttendance: number;
  averageSubmissionRate: number;
  atRiskStudents: number;
  summary: string;
  highPerformers: StudentInsight[];
  recommendations: string[];
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
  const highPerformers = studentsWithRisk.filter((s) => s.performance === "high");

  let summary = "";
  let recommendations: string[] = [];

  try {
    const prompt = `Analyze student performance for a class and provide a concise, encouraging summary plus actionable recommendations.

Class: ${data.cls.name} (${data.cls.department}, Batch ${data.cls.batch})
Total Sessions: ${data.totalSessions}
Total Assignments: ${data.totalAssignments}

Student Data:
${JSON.stringify(
  studentsWithRisk.map((s) => ({
    name: s.name,
    roll: s.rollNumber,
    attendance: s.attendancePercentage + "%",
    submissions: `${s.assignmentsSubmitted}/${s.totalAssignments}`,
    marks: s.averageMarks + "%",
    riskLevel: s.riskLevel,
    performance: s.performance,
  })),
  null,
  2
)}

Return JSON with this exact structure:
{
  "summary": "a 2-3 sentence overall class summary that is factual and encouraging",
  "recommendations": ["3-4 concise, actionable recommendations for the teacher"]
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
      ? parsed.recommendations.filter((r): r is string => typeof r === "string").map((r) => r.trim()).filter(Boolean)
      : [];
  } catch {
    summary = "AI analysis unavailable. Configure GROQ_API_KEY in .env to enable.";
  }

  const avgAttendance = data.students.length > 0
    ? Math.round(data.students.reduce((sum, s) => sum + s.attendancePercentage, 0) / data.students.length)
    : 0;
  const avgSubmission = data.students.length > 0
    ? Math.round(data.students.reduce((sum, s) => sum + s.submissionRate, 0) / data.students.length)
    : 0;

  return {
    classId: String(data.cls._id),
    className: data.cls.name,
    totalStudents: data.students.length,
    averageAttendance: avgAttendance,
    averageSubmissionRate: avgSubmission,
    atRiskStudents: atRiskStudents.length,
    summary,
    highPerformers,
    recommendations,
    students: studentsWithRisk,
  };
}
