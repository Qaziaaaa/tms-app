import { prisma } from "@/lib/prisma";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return JSON.stringify({ error: "GROQ_API_KEY not configured" });
  }

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You are an academic analytics assistant. Analyze student data and return JSON responses only. No markdown, no explanations outside JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
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
  aiAnalysis: string;
}

export interface ClassInsight {
  classId: string;
  className: string;
  totalStudents: number;
  averageAttendance: number;
  averageSubmissionRate: number;
  atRiskStudents: number;
  cramStudents: StudentInsight[];
  students: StudentInsight[];
}

async function getClassDataForAI(classId: string) {
  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) return null;

  const students = await prisma.student.findMany({
    where: { classId },
    orderBy: { rollNumber: "asc" },
  });

  const totalSessions = await prisma.attendanceSession.count({ where: { classId } });
  const totalAssignments = await prisma.assignment.count({ where: { classId } });

  const studentData = await Promise.all(
    students.map(async (student) => {
      const sessionsAttended = await prisma.attendanceRecord.count({
        where: {
          studentId: student.id,
          session: { classId },
          status: "PRESENT",
        },
      });

      const submissions = await prisma.assignmentSubmission.findMany({
        where: {
          studentId: student.id,
          assignment: { classId },
        },
      });

      const submittedCount = submissions.filter(
        (s) => s.status === "SUBMITTED" || s.status === "LATE"
      ).length;

      const totalMarksObtained = submissions.reduce((sum, s) => sum + (s.marks ?? 0), 0);
      const totalPossibleMarks = totalAssignments * 100;

      const attendancePercentage = totalSessions > 0 ? Math.round((sessionsAttended / totalSessions) * 100) : 0;
      const submissionRate = totalAssignments > 0 ? Math.round((submittedCount / totalAssignments) * 100) : 0;
      const averageMarks = totalPossibleMarks > 0 ? Math.round((totalMarksObtained / totalPossibleMarks) * 100) : 0;

      return {
        studentId: student.id,
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
    let riskLevel: "low" | "medium" | "high" = "low";
    if (s.attendancePercentage < 40 || s.submissionRate < 30) riskLevel = "high";
    else if (s.attendancePercentage < 60 || s.submissionRate < 50) riskLevel = "medium";
    return { ...s, riskLevel, aiAnalysis: "" };
  });

  const atRiskStudents = studentsWithRisk.filter((s) => s.riskLevel === "high" || s.riskLevel === "medium");

  let aiAnalysis: string[] = [];

  try {
    const prompt = `Analyze this class data for cram students (students who only attend before exams).

Class: ${data.cls.name} (${data.cls.department}, Batch ${data.cls.batch})
Total Sessions: ${data.totalSessions}
Total Assignments: ${data.totalAssignments}

Student Data:
${JSON.stringify(
  data.students.map((s) => ({
    name: s.name,
    roll: s.rollNumber,
    attendance: s.attendancePercentage + "%",
    sessions: `${s.sessionsAttended}/${s.totalSessions}`,
    submissions: `${s.assignmentsSubmitted}/${s.totalAssignments}`,
    marks: s.averageMarks + "%",
  })),
  null,
  2
)}

Return JSON with this exact structure:
{
  "analysis": "brief overall class summary (2-3 sentences)",
  "cramStudents": ["list of student names who appear to be cram students based on patterns"],
  "recommendations": ["actionable recommendations for the teacher"]
}`;

    const response = await callGroq(prompt);
    try {
      const parsed = JSON.parse(response);
      aiAnalysis = [
        parsed.analysis || "",
        ...(parsed.cramStudents?.length ? [`Likely cram students: ${parsed.cramStudents.join(", ")}`] : []),
        ...(parsed.recommendations || []),
      ];
    } catch {
      aiAnalysis = [response];
    }
  } catch {
    aiAnalysis = ["AI analysis unavailable. Configure GROQ_API_KEY in .env to enable."];
  }

  const avgAttendance = data.students.length > 0
    ? Math.round(data.students.reduce((sum, s) => sum + s.attendancePercentage, 0) / data.students.length)
    : 0;
  const avgSubmission = data.students.length > 0
    ? Math.round(data.students.reduce((sum, s) => sum + s.submissionRate, 0) / data.students.length)
    : 0;

  return {
    classId: data.cls.id,
    className: data.cls.name,
    totalStudents: data.students.length,
    averageAttendance: avgAttendance,
    averageSubmissionRate: avgSubmission,
    atRiskStudents: atRiskStudents.length,
    cramStudents: studentsWithRisk.filter((s) => aiAnalysis.some((a) => a.includes(s.name))),
    students: studentsWithRisk,
  };
}
