"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StudentShell } from "@/components/layout/student-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ClipboardCheck,
  FileText,
  TrendingUp,
  CalendarDays,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

import {
  getStudentProfile,
  getStudentAttendance,
  getStudentGrades,
  getStudentAssignments,
} from "@/lib/api";
import type {
  PortalProfileDTO,
  PortalAttendanceDTO,
  PortalGradesDTO,
  PortalAssignmentsDTO,
} from "@/types/api";

const attendanceChartConfig = {
  present: { label: "Present", color: "var(--chart-2)" },
  absent: { label: "Absent", color: "var(--chart-4)" },
} satisfies ChartConfig;

const gradeChartConfig = {
  percentage: { label: "Score %", color: "var(--chart-1)" },
} satisfies ChartConfig;

function currentWeek() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? 1 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return names.map((name, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return {
      name,
      date: String(day.getDate()).padStart(2, "0"),
      isToday: day.toDateString() === today.toDateString(),
    };
  });
}

const ACTIVE_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<PortalProfileDTO | null>(null);
  const [attendance, setAttendance] = useState<PortalAttendanceDTO | null>(null);
  const [grades, setGrades] = useState<PortalGradesDTO | null>(null);
  const [assignments, setAssignments] = useState<PortalAssignmentsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    void Promise.resolve().then(() => setNow(Date.now()));
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      Promise.all([
        getStudentProfile(),
        getStudentAttendance(),
        getStudentGrades(),
        getStudentAssignments(),
      ])
        .then(([profileData, attendanceData, gradesData, assignmentsData]) => {
          setProfile(profileData);
          setAttendance(attendanceData);
          setGrades(gradesData);
          setAssignments(assignmentsData);
          setLoading(false);
        })
        .catch((e) => {
          setError(e instanceof Error ? e.message : "Failed to load dashboard data");
          setLoading(false);
        });
    }
  }, [status, router]);

  if (status === "loading" || !session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <Skeleton className="h-6 w-48" />
        </div>
      </div>
    );
  }

  const name = profile?.name || session.user.name || "Student";
  const batch = profile?.class?.batch || "—";
  const className = profile?.class?.name || "—";
  const department = profile?.class?.department || "";

  const summary = attendance?.summary;
  const present = summary?.present ?? 0;
  const totalDays = summary?.totalDays ?? 0;
  const percentage = Math.round(summary?.percentage ?? 0);

  let standingText = "Good Standing";
  let standingColor = "hsl(var(--clr-green))";
  if (percentage < 50) {
    standingText = "Low Attendance";
    standingColor = "hsl(var(--clr-red))";
  } else if (percentage < 75) {
    standingText = "Average Standing";
    standingColor = "hsl(var(--clr-amber))";
  }

  const week = currentWeek();

  return (
    <StudentShell user={{ name: session.user.name || "", email: session.user.email || "" }}>
      <div className="page-stack">
        {/* Welcome banner */}
        <div className="flex flex-col gap-3 rounded-xl bg-gradient-to-r from-black via-zinc-900 to-zinc-800 p-5 text-white shadow-md border border-zinc-800/80 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-zinc-800 to-zinc-700 px-2.5 py-0.5 text-xs font-semibold text-zinc-200 border border-zinc-600/40 shadow-xs">
              <GraduationCap size={15} />
              <span>Student Portal</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl text-white">
              Welcome back, <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">{name}</span>!
            </h2>
            <p className="mt-1 text-xs text-zinc-300">
              {className} &middot; Roll #{profile?.rollNumber} &middot; {department || `Batch ${batch}`}
            </p>
          </div>
          <Link
            href="/student/assignments"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3.5 text-xs font-semibold text-zinc-900 shadow-sm transition-all hover:bg-zinc-100 hover:shadow"
          >
            View My Assignments <ArrowRight size={15} />
          </Link>
        </div>

        {error ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/20 bg-card p-8 text-center shadow-sm">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="mt-2 text-sm font-medium text-destructive">{error}</p>
          </div>
        ) : (
          <>
            {/* Metric cards + schedule widget */}
            <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
              <div className="grid gap-2 sm:grid-cols-3">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)
                ) : (
                  <>
                    <StatCard
                      label="My Attendance"
                      value={`${present}/${totalDays}`}
                      subtitle={`${percentage}% ${standingText}`}
                      subtitleColor={standingColor}
                      icon={ClipboardCheck}
                      iconBg="bg-muted"
                      iconColor="text-primary"
                    />
                    <StatCard
                      label="Assignments"
                      value={`${assignments?.summary.submitted ?? 0}/${assignments?.summary.total ?? 0}`}
                      subtitle={`${assignments?.summary.overdue ?? 0} overdue`}
                      subtitleColor="hsl(var(--clr-blue))"
                      icon={FileText}
                      iconBg="bg-muted"
                      iconColor="text-primary"
                    />
                    <StatCard
                      label="Overall Grade"
                      value={`${grades?.summary.overallPercentage ?? 0}%`}
                      subtitle={(grades?.summary.overallPercentage ?? 0) >= 70 ? "Passing" : "Needs improvement"}
                      subtitleColor={
                        (grades?.summary.overallPercentage ?? 0) >= 70 ? "hsl(var(--clr-green))" : "hsl(var(--clr-amber))"
                      }
                      icon={TrendingUp}
                      iconBg="hsl(var(--clr-amber-bg))"
                      iconColor="hsl(var(--clr-amber))"
                    />
                  </>
                )}
              </div>

              {/* Class schedule widget */}
              <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                <div className="px-2 pb-1.5 pt-2">
                  <h3 className="flex items-center gap-1 text-base font-semibold text-card-foreground">
                    <CalendarDays size={18} /> Class Schedule
                  </h3>
                </div>
                <div className="px-2 pb-2">
                  <div className="grid grid-cols-7 gap-1">
                    {week.map((day) => {
                      const active = ACTIVE_DAYS.includes(day.name);
                      return (
                        <div
                          key={day.name}
                          className={`flex flex-col items-center justify-center rounded-md border p-1 ${
                            active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"
                          }`}
                        >
                          <span className={active ? "text-[11px] font-semibold" : "text-[11px] font-medium"}>{day.name}</span>
                          <span className={`mt-0.5 text-sm ${active ? "font-bold" : "font-medium"}`}>{day.date}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-center text-xs font-semibold text-primary">
                    {className} &middot; Class Days
                  </p>
                </div>
              </div>
            </div>

            {/* Charts */}
            {!loading && (
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="surface">
                  <div className="surface-header">
                    <h3 className="text-base font-semibold text-card-foreground">Attendance Trend</h3>
                  </div>
                  {attendance?.monthlyBreakdown && attendance.monthlyBreakdown.length > 0 ? (
                    <div className="p-2.5">
                      <ChartContainer config={attendanceChartConfig} className="h-[220px] w-full">
                        <BarChart data={attendance.monthlyBreakdown}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="present" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="absent" fill="var(--chart-4)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ChartContainer>
                    </div>
                  ) : (
                    <p className="p-6 text-center text-sm text-muted-foreground">No attendance data yet</p>
                  )}
                </div>

                <div className="surface">
                  <div className="surface-header">
                    <h3 className="text-base font-semibold text-card-foreground">Grade Trend</h3>
                  </div>
                  {grades?.gradeTrend && grades.gradeTrend.length > 0 ? (
                    <div className="p-2.5">
                      <ChartContainer config={gradeChartConfig} className="h-[220px] w-full">
                        <BarChart data={grades.gradeTrend}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                          <XAxis dataKey="title" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={50} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="percentage" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ChartContainer>
                    </div>
                  ) : (
                    <p className="p-6 text-center text-sm text-muted-foreground">No graded assignments yet</p>
                  )}
                </div>
              </div>
            )}

            {/* Recent attendance + upcoming assignments */}
            {!loading && (
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="surface">
                  <div className="surface-header flex flex-wrap items-center justify-between gap-1">
                    <div>
                      <h3 className="text-base font-semibold text-card-foreground">Recent Attendance</h3>
                      <p className="text-[13px] text-muted-foreground">Your latest recorded sessions.</p>
                    </div>
                  </div>
                  {attendance?.recentSessions && attendance.recentSessions.length > 0 ? (
                    <div>
                      {attendance.recentSessions.map((s, i) => (
                        <div
                          key={i}
                          className={`flex items-center justify-between gap-2 p-2 hover:bg-muted ${
                            i < attendance.recentSessions.length - 1 ? "border-b border-border" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${s.status === "PRESENT" ? "bg-clr-green" : "bg-clr-red"}`} />
                            <div>
                              <p className="text-[13px] font-medium text-card-foreground">
                                {new Date(s.date).toLocaleDateString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                              <p className="text-xs text-muted-foreground">{s.className}</p>
                            </div>
                          </div>
                          <Badge variant={s.status === "PRESENT" ? "default" : "destructive"} className="text-xs">
                            {s.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="p-6 text-center text-sm text-muted-foreground">No attendance records yet</p>
                  )}
                </div>

                <div className="surface">
                  <div className="surface-header flex flex-wrap items-center justify-between gap-1">
                    <div>
                      <h3 className="flex items-center gap-1 text-base font-semibold text-card-foreground">
                        <BookOpen size={18} /> Upcoming Assignments
                      </h3>
                      <p className="text-[13px] text-muted-foreground">Assignments due soon.</p>
                    </div>
                    <Link href="/student/assignments" className="text-xs font-medium text-primary hover:underline">
                      Manage All
                    </Link>
                  </div>
                  {assignments?.upcoming && assignments.upcoming.length > 0 ? (
                    <div>
                      {assignments.upcoming.map((a) => {
                        const daysLeft =
                          now === null
                            ? null
                            : Math.ceil((new Date(a.dueDate).getTime() - now) / (1000 * 60 * 60 * 24));
                        return (
                          <div
                            key={a.id}
                            className="flex items-center justify-between gap-2 border-b border-border p-2 last:border-0 hover:bg-muted"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-medium text-card-foreground">{a.title}</p>
                              <p className="text-xs text-muted-foreground">
                                Due{" "}
                                {new Date(a.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </p>
                            </div>
                            <Badge
                              variant={daysLeft !== null && daysLeft <= 2 ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {daysLeft === null ? "…" : daysLeft <= 0 ? "Due today" : `${daysLeft}d left`}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <CheckCircle2 className="mb-2 h-8 w-8 text-clr-green" />
                      <p className="text-sm text-muted-foreground">All caught up!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </StudentShell>
  );
}
