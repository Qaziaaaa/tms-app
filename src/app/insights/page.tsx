"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Brain, AlertTriangle, ShieldCheck, TrendingDown } from "lucide-react";
import { toast } from "sonner";

interface ClassItem { id: string; name: string; department: string; }
interface StudentInsight {
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
interface ClassInsight {
  classId: string;
  className: string;
  totalStudents: number;
  averageAttendance: number;
  averageSubmissionRate: number;
  atRiskStudents: number;
  cramStudents: StudentInsight[];
  students: StudentInsight[];
}

export default function InsightsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<ClassInsight | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      fetch("/api/classes").then(r => r.json()).then((json) => {
        const data = json.data as ClassItem[];
        setClasses(data);
        setLoading(false);
        if (data.length > 0) setSelectedClassId(data[0].id);
      });
    }
  }, [status, router]);

  async function fetchInsights() {
    if (!selectedClassId) return;
    setLoadingInsights(true);
    setInsights(null);
    const res = await fetch(`/api/ai?classId=${selectedClassId}`);
    if (res.ok) {
      const json = await res.json();
      setInsights(json.data);
    } else {
      const json = await res.json();
      toast.error(json.message || "Failed to generate insights");
    }
    setLoadingInsights(false);
  }

  useEffect(() => {
    if (selectedClassId) fetchInsights();
  }, [selectedClassId]);

  function getRiskBadge(level: string) {
    if (level === "high") return <Badge className="bg-red-600">High Risk</Badge>;
    if (level === "medium") return <Badge className="bg-yellow-500 text-black">Medium</Badge>;
    return <Badge className="bg-green-600">Low</Badge>;
  }

  function getAttBadge(pct: number) {
    if (pct >= 80) return <span className="text-green-600 font-medium">{pct}%</span>;
    if (pct >= 60) return <span className="text-yellow-500 font-medium">{pct}%</span>;
    return <span className="text-red-600 font-medium">{pct}%</span>;
  }

  if (status === "loading" || !session?.user) {
    return <div className="flex min-h-screen items-center justify-center"><Skeleton className="h-8 w-48" /></div>;
  }

  return (
    <AppShell user={{ name: session.user.name || "", email: session.user.email || "" }}>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            <h1 className="text-2xl font-bold tracking-tight">AI Insights</h1>
          </div>
          <p className="text-muted-foreground mt-0.5 ml-8">AI-powered student risk analysis and performance predictions</p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {loading ? <Skeleton className="h-10 w-64" /> : (
            <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
              {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.department}</option>)}
            </select>
          )}
          <Button onClick={fetchInsights} disabled={loadingInsights || !selectedClassId}>
            {loadingInsights ? "Analyzing..." : "Refresh Analysis"}
          </Button>
        </div>

        {loadingInsights && !insights ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
          </div>
        ) : insights ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="card-shadow card-hover">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="rounded-xl bg-green-500/10 p-3">
                    <ShieldCheck className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avg Attendance</p>
                    <p className="text-2xl font-bold mt-0.5">{insights.averageAttendance}%</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="card-shadow card-hover">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="rounded-xl bg-blue-500/10 p-3">
                    <TrendingDown className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avg Submission Rate</p>
                    <p className="text-2xl font-bold mt-0.5">{insights.averageSubmissionRate}%</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="card-shadow card-hover">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="rounded-xl bg-yellow-500/10 p-3">
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">At-Risk Students</p>
                    <p className="text-2xl font-bold mt-0.5">{insights.atRiskStudents}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="card-shadow card-hover">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="rounded-xl bg-purple-500/10 p-3">
                    <Brain className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Students</p>
                    <p className="text-2xl font-bold mt-0.5">{insights.totalStudents}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="card-shadow">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Brain className="h-5 w-5 text-purple-600" /> AI Analysis</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {insights.students.length === 0
                    ? "No student data available for analysis."
                    : `Analyzing ${insights.totalStudents} students across ${insights.students[0]?.totalSessions || 0} sessions and ${insights.students[0]?.totalAssignments || 0} assignments. ${insights.atRiskStudents} student(s) flagged as at-risk.`}
                </p>
                {insights.cramStudents.length > 0 && (
                  <div className="mt-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
                    <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                      Likely Cram Students: {insights.cramStudents.map(s => s.name).join(", ")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="card-shadow">
              <CardHeader><CardTitle className="text-lg">Student Risk Analysis</CardTitle></CardHeader>
              <CardContent>
                <div className="max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Roll</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-center">Attendance</TableHead>
                        <TableHead className="text-center">Submissions</TableHead>
                        <TableHead className="text-center">Marks</TableHead>
                        <TableHead className="text-center">Risk</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {insights.students.sort((a, b) => {
                        const order = { high: 0, medium: 1, low: 2 };
                        return order[a.riskLevel] - order[b.riskLevel];
                      }).map(s => (
                        <TableRow key={s.studentId}>
                          <TableCell><Badge variant="outline">{s.rollNumber}</Badge></TableCell>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell className="text-center">{getAttBadge(s.attendancePercentage)}</TableCell>
                          <TableCell className="text-center">{s.assignmentsSubmitted}/{s.totalAssignments} ({s.submissionRate}%)</TableCell>
                          <TableCell className="text-center">{s.averageMarks}%</TableCell>
                          <TableCell className="text-center">{getRiskBadge(s.riskLevel)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="card-shadow">
            <CardContent className="py-16 text-center text-muted-foreground">
              Select a class and click &quot;Refresh Analysis&quot; to get AI insights.
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
