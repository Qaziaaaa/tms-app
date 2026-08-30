"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Brain, AlertTriangle, ShieldCheck, TrendingDown, Trophy, ChevronDown, ChevronUp, Users } from "lucide-react";
import { toast } from "sonner";
import { getClasses, getInsights } from "@/lib/api";
import { getErrorMessage } from "@/hooks/use-api-data";
import type { ClassDTO, ClassInsightDTO } from "@/types/api";

function CategoryCard({
  title,
  icon: Icon,
  color,
  students,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: "green" | "yellow" | "red";
  students: ClassInsightDTO["categories"]["top"];
}) {
  const [expanded, setExpanded] = useState(false);
  const colorMap = {
    green: { bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-700 dark:text-green-400", icon: "text-green-600", badge: "bg-green-600" },
    yellow: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-700 dark:text-amber-400", icon: "text-amber-600", badge: "bg-amber-500" },
    red: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-700 dark:text-red-400", icon: "text-red-600", badge: "bg-red-600" },
  };
  const c = colorMap[color];
  const shown = expanded ? students : students.slice(0, 3);

  return (
    <Card className={`card-shadow border ${c.border}`}>
      <CardHeader className="pb-3">
        <CardTitle className={`text-base flex items-center gap-2 ${c.text}`}>
          <div className={`rounded-lg ${c.bg} p-1.5`}>
            <Icon className={`h-4 w-4 ${c.icon}`} />
          </div>
          {title}
          <Badge className={`ml-auto ${c.badge}`}>{students.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        {students.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No students in this category.</p>
        ) : (
          <>
            <div className="space-y-0">
              {shown.map((s) => (
                <div key={s.rollNumber} className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
                  <Badge variant="outline" className="shrink-0 text-xs mt-0.5">{s.rollNumber}</Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">{s.name}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{s.brief}</p>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      <span>Att: {s.attendance}%</span>
                      <span>Sub: {s.submissionRate}%</span>
                      <span>Marks: {s.marks}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {students.length > 3 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground mt-2 pt-1"
              >
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {expanded ? "Show less" : `Show all ${students.length} students`}
              </button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function InsightsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState<ClassDTO[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<ClassInsightDTO | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      getClasses()
        .then((data) => {
          setClasses(data);
          if (data.length > 0) setSelectedClassId(data[0].id);
        })
        .catch(() => setClasses([]))
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  const fetchInsights = useCallback(async () => {
    if (!selectedClassId) return;
    setLoadingInsights(true);
    try {
      setInsights(await getInsights(selectedClassId));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
    setLoadingInsights(false);
  }, [selectedClassId]);

  useEffect(() => {
    if (!selectedClassId) return;
    void Promise.resolve().then(() => fetchInsights());
  }, [fetchInsights, selectedClassId]);

  function getRiskBadge(level: string) {
    if (level === "high") return <Badge className="bg-red-600">High Risk</Badge>;
    if (level === "medium") return <Badge className="bg-amber-500 text-black">Medium</Badge>;
    return <Badge className="bg-green-600">Low</Badge>;
  }

  function getPerfBadge(perf: string) {
    if (perf === "high") return <Badge className="bg-purple-600">Top Performer</Badge>;
    if (perf === "low") return <Badge className="bg-red-600/80">At Risk</Badge>;
    return <Badge className="bg-amber-500 text-black">Average</Badge>;
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
          <p className="text-muted-foreground mt-0.5 ml-8">AI-powered class performance analysis with student categorization</p>
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
            {/* Stat cards */}
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
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Students</p>
                    <p className="text-2xl font-bold mt-0.5">{insights.totalStudents}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Summary */}
            <Card className="card-shadow">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Brain className="h-5 w-5 text-purple-600" /> Class Overview</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {insights.summary ? (
                  <p className="text-sm leading-relaxed text-foreground">{insights.summary}</p>
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {insights.students.length === 0
                      ? "No student data available for analysis."
                      : "AI summary unavailable."}
                  </p>
                )}
                {insights.recommendations.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Recommendations</p>
                    <ul className="space-y-1.5">
                      {insights.recommendations.map((r, i) => (
                        <li key={i} className="flex gap-2 text-sm text-muted-foreground leading-relaxed">
                          <span className="text-purple-600 shrink-0 font-medium">{i + 1}.</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category cards */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Student Categories</h2>
              <div className="grid gap-4 lg:grid-cols-3">
                <CategoryCard title="Top Performers" icon={Trophy} color="green" students={insights.categories.top} />
                <CategoryCard title="Average" icon={Users} color="yellow" students={insights.categories.average} />
                <CategoryCard title="At Risk" icon={AlertTriangle} color="red" students={insights.categories.atRisk} />
              </div>
            </div>

            {/* Detailed table (collapsible) */}
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between cursor-pointer select-none" onClick={() => setShowDetails(!showDetails)}>
                  <span>Detailed Student Table</span>
                  {showDetails ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                </CardTitle>
              </CardHeader>
              {showDetails && (
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
                          <TableHead className="text-center">Performance</TableHead>
                          <TableHead className="text-center">Risk</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...insights.students].sort((a, b) => {
                          const order = { high: 0, medium: 1, low: 2 };
                          return order[a.riskLevel] - order[b.riskLevel];
                        }).map(s => (
                          <TableRow key={s.studentId}>
                            <TableCell><Badge variant="outline">{s.rollNumber}</Badge></TableCell>
                            <TableCell className="font-medium">{s.name}</TableCell>
                            <TableCell className="text-center">
                              <span className={s.attendancePercentage >= 70 ? "text-green-600 font-medium" : s.attendancePercentage >= 50 ? "text-amber-500 font-medium" : "text-red-600 font-medium"}>
                                {s.attendancePercentage}%
                              </span>
                            </TableCell>
                            <TableCell className="text-center">{s.assignmentsSubmitted}/{s.totalAssignments} ({s.submissionRate}%)</TableCell>
                            <TableCell className="text-center">{s.averageMarks}%</TableCell>
                            <TableCell className="text-center">{getPerfBadge(s.performance)}</TableCell>
                            <TableCell className="text-center">{getRiskBadge(s.riskLevel)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              )}
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
