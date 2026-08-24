"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { StudentShell } from "@/components/layout/student-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, Award, BarChart3 } from "lucide-react";
import { getStudentGrades } from "@/lib/api";
import type { PortalGradesDTO } from "@/types/api";

const barConfig = {
  percentage: { label: "Score %", color: "var(--clr-blue)" },
} satisfies ChartConfig;

const PIE_COLORS = ["var(--clr-green)", "var(--clr-blue)", "var(--clr-amber)", "var(--clr-red)", "var(--clr-purple)"];

const distributionConfig = {
  excellent: { label: "Excellent (80+)", color: "var(--clr-green)" },
  good: { label: "Good (60-79)", color: "var(--clr-blue)" },
  average: { label: "Average (40-59)", color: "var(--clr-amber)" },
  below: { label: "Below (<40)", color: "var(--clr-red)" },
  unscored: { label: "Not Submitted", color: "var(--clr-purple)" },
} satisfies ChartConfig;

function getGradeBadge(percentage: number) {
  if (percentage >= 80) return { label: "Excellent", variant: "default" as const };
  if (percentage >= 60) return { label: "Good", variant: "secondary" as const };
  if (percentage >= 40) return { label: "Average", variant: "secondary" as const };
  return { label: "Below Avg", variant: "destructive" as const };
}

export default function StudentGrades() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<PortalGradesDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      getStudentGrades()
        .then(setData)
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  if (status === "loading" || !session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  const pieData = data?.distribution
    ? [
        { name: "Excellent", value: data.distribution.excellent, color: PIE_COLORS[0] },
        { name: "Good", value: data.distribution.good, color: PIE_COLORS[1] },
        { name: "Average", value: data.distribution.average, color: PIE_COLORS[2] },
        { name: "Below", value: data.distribution.below, color: PIE_COLORS[3] },
        { name: "Unscored", value: data.distribution.unscored, color: PIE_COLORS[4] },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <StudentShell user={{ name: session.user.name || "", email: session.user.email || "" }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Grades</h1>
          <p className="text-sm text-muted-foreground mt-0.5">View your assignment scores and performance</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)
            : data?.summary && (
                <>
                  <Card className="card-shadow">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="rounded-xl bg-emerald-500/10 p-3">
                        <Award className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Marks Obtained</p>
                        <p className="text-2xl font-bold">{data.summary.totalMarksObtained}</p>
                        <p className="text-xs text-muted-foreground">out of {data.summary.totalPossibleMarks}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="card-shadow">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="rounded-xl bg-blue-500/10 p-3">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overall Average</p>
                        <p className="text-2xl font-bold">{data.summary.overallPercentage}%</p>
                        <p className="text-xs text-muted-foreground">
                          {data.summary.overallPercentage >= 70 ? "Passing" : "Needs improvement"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="card-shadow">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="rounded-xl bg-purple-500/10 p-3">
                        <BarChart3 className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assignments</p>
                        <p className="text-2xl font-bold">{data.grades.length}</p>
                        <p className="text-xs text-muted-foreground">total assignments</p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {!loading && data?.gradeTrend && data.gradeTrend.length > 0 && (
            <Card className="card-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Score Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={barConfig} className="h-[260px] w-full">
                  <BarChart data={data.gradeTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="title" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={60} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="percentage" fill="var(--clr-blue)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {!loading && pieData.length > 0 && (
            <Card className="card-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Grade Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <ChartContainer config={distributionConfig} className="h-[200px] w-[200px]">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                  <div className="space-y-2">
                    {pieData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                        <span className="text-sm text-muted-foreground">{d.name}</span>
                        <span className="text-sm font-semibold ml-auto">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="card-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Grade Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : data?.grades.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No grades available yet.</p>
            ) : (
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-semibold">Assignment</TableHead>
                      <TableHead className="font-semibold">Marks</TableHead>
                      <TableHead className="font-semibold">Percentage</TableHead>
                      <TableHead className="font-semibold">Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.grades.map((g) => {
                      const grade = getGradeBadge(g.percentage);
                      return (
                        <TableRow key={g.assignmentId}>
                          <TableCell className="font-medium">{g.title}</TableCell>
                          <TableCell>
                            {g.marks}/{g.totalMarks}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary transition-all"
                                  style={{ width: `${g.percentage}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{g.percentage}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={grade.variant} className="text-xs">
                              {grade.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StudentShell>
  );
}
