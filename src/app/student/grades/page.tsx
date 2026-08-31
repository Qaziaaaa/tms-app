"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { StudentShell } from "@/components/layout/student-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Award, BarChart3, GraduationCap } from "lucide-react";
import { getStudentGrades } from "@/lib/api";
import type { PortalGradesDTO } from "@/types/api";

const barConfig = {
  percentage: { label: "Score %", color: "var(--chart-1)" },
} satisfies ChartConfig;

const PIE_COLORS = ["var(--chart-2)", "var(--chart-1)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

const distributionConfig = {
  excellent: { label: "Excellent (80+)", color: "var(--chart-2)" },
  good: { label: "Good (60-79)", color: "var(--chart-1)" },
  average: { label: "Average (40-59)", color: "var(--chart-3)" },
  below: { label: "Below (<40)", color: "var(--chart-4)" },
  unscored: { label: "Not Submitted", color: "var(--chart-5)" },
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
      <div className="page-stack">
        <div>
          <h2 className="page-title">My Grades</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">View your assignment scores and performance.</p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          ) : (
            <>
              <StatCard
                label="Marks Obtained"
                value={data?.summary.totalMarksObtained ?? 0}
                subtitle={`out of ${data?.summary.totalPossibleMarks ?? 0}`}
                subtitleColor="var(--chart-2)"
                icon={Award}
                iconBg="bg-emerald-500/10 dark:bg-emerald-500/20"
                iconColor="text-emerald-600 dark:text-emerald-400"
              />
              <StatCard
                label="Overall Average"
                value={`${data?.summary.overallPercentage ?? 0}%`}
                subtitle={(data?.summary.overallPercentage ?? 0) >= 70 ? "Passing" : "Needs improvement"}
                subtitleColor={(data?.summary.overallPercentage ?? 0) >= 70 ? "var(--chart-2)" : "var(--chart-3)"}
                icon={TrendingUp}
                iconBg="bg-blue-500/10 dark:bg-blue-500/20"
                iconColor="text-blue-600 dark:text-blue-400"
              />
              <StatCard
                label="Assignments"
                value={data?.grades.length ?? 0}
                subtitle="total assignments"
                subtitleColor="var(--chart-5)"
                icon={BarChart3}
                iconBg="bg-purple-500/10 dark:bg-purple-500/20"
                iconColor="text-purple-600 dark:text-purple-400"
              />
            </>
          )}
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {!loading && data?.gradeTrend && data.gradeTrend.length > 0 && (
            <div className="surface">
              <div className="surface-header">
                <h3 className="text-base font-semibold text-card-foreground">Score Trend</h3>
              </div>
              <div className="p-2.5">
                <ChartContainer config={barConfig} className="h-[240px] w-full">
                  <BarChart data={data.gradeTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="title" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={60} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="percentage" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>
          )}

          {!loading && pieData.length > 0 && (
            <div className="surface">
              <div className="surface-header">
                <h3 className="text-base font-semibold text-card-foreground">Grade Distribution</h3>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4 sm:gap-6 p-3">
                <ChartContainer config={distributionConfig} className="h-[190px] w-[190px]">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
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
                      <div className="h-3 w-3 rounded-full shadow-xs" style={{ backgroundColor: PIE_COLORS[i] }} />
                      <span className="text-sm text-muted-foreground">{d.name}</span>
                      <span className="ml-auto text-sm font-semibold">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="surface">
          <div className="surface-header">
            <h3 className="text-base font-semibold text-card-foreground">Grade Breakdown</h3>
            <p className="text-[13px] text-muted-foreground">Marks and grade per assignment.</p>
          </div>

          {loading ? (
            <div className="space-y-1 p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : !data || data.grades.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <GraduationCap className="mb-2 h-8 w-8" />
              <p className="text-sm">No grades available yet.</p>
            </div>
          ) : (
            <div>
              {data.grades.map((g, index) => {
                const grade = getGradeBadge(g.percentage);
                return (
                  <div
                    key={g.assignmentId}
                    className={`flex flex-col gap-1 p-2 hover:bg-muted sm:flex-row sm:items-center sm:justify-between ${
                      index < data.grades.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-medium text-card-foreground">{g.title}</span>
                        <Badge variant={grade.variant} className="text-xs">
                          {grade.label}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {g.marks}/{g.totalMarks} marks
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-clr-blue transition-all"
                          style={{ width: `${g.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-card-foreground">{g.percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StudentShell>
  );
}
