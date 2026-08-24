"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { StudentShell } from "@/components/layout/student-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ClipboardCheck,
  FileText,
  TrendingUp,
  Flame,
  Calendar,
  Clock,
  AlertCircle,
  BookOpen,
  CheckCircle2,
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
  present: { label: "Present", color: "var(--clr-green)" },
  absent: { label: "Absent", color: "var(--clr-red)" },
} satisfies ChartConfig;

const gradeChartConfig = {
  percentage: { label: "Score %", color: "var(--clr-blue)" },
} satisfies ChartConfig;

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<PortalProfileDTO | null>(null);
  const [attendance, setAttendance] = useState<PortalAttendanceDTO | null>(null);
  const [grades, setGrades] = useState<PortalGradesDTO | null>(null);
  const [assignments, setAssignments] = useState<PortalAssignmentsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const greetTime = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <StudentShell user={{ name: session.user.name || "", email: session.user.email || "" }}>
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-primary/70 p-6 sm:p-8 text-primary-foreground">
          <div className="relative z-10">
            <p className="text-sm font-medium opacity-80">{greetTime()}</p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
              Welcome back, {profile?.name || session.user.name}
            </h1>
            {profile && (
              <p className="text-sm opacity-70 mt-1.5">
                {profile.class.name} &middot; Roll #{profile.rollNumber} &middot; {profile.class.department}
              </p>
            )}
          </div>
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -right-4 bottom-0 h-24 w-24 rounded-full bg-white/5" />
        </div>

        {error ? (
          <Card className="card-shadow border-destructive/20">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-10 w-10 text-destructive mb-3" />
              <p className="text-sm font-medium text-destructive">{error}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="card-shadow">
                      <CardContent className="flex items-center gap-4 p-5">
                        <Skeleton className="h-12 w-12 rounded-xl" />
                        <div className="space-y-2">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-7 w-12" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                : [
                    {
                      title: "Attendance",
                      value: `${attendance?.summary.percentage ?? 0}%`,
                      icon: ClipboardCheck,
                      color: "bg-emerald-500/10 text-emerald-600",
                      detail: `${attendance?.summary.present ?? 0}/${attendance?.summary.totalDays ?? 0} days present`,
                    },
                    {
                      title: "Assignments",
                      value: `${assignments?.summary.submitted ?? 0}/${assignments?.summary.total ?? 0}`,
                      icon: FileText,
                      color: "bg-blue-500/10 text-blue-600",
                      detail: `${assignments?.summary.overdue ?? 0} overdue`,
                    },
                    {
                      title: "Overall Grade",
                      value: `${grades?.summary.overallPercentage ?? 0}%`,
                      icon: TrendingUp,
                      color: "bg-purple-500/10 text-purple-600",
                      detail:
                        (grades?.summary.overallPercentage ?? 0) >= 70
                          ? "Passing"
                          : "Needs improvement",
                    },
                    {
                      title: "Attendance Streak",
                      value: `${attendance?.streak.current ?? 0}`,
                      icon: Flame,
                      color: "bg-orange-500/10 text-orange-600",
                      detail: `Longest: ${attendance?.streak.longest ?? 0} days`,
                    },
                  ].map((s) => (
                    <Card key={s.title} className="card-shadow card-hover group cursor-default">
                      <CardContent className="flex items-start gap-4 p-5">
                        <div className={`rounded-xl p-3 ${s.color}`}>
                          <s.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {s.title}
                          </p>
                          <p className="text-2xl font-bold mt-0.5">{s.value}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{s.detail}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
            </div>

            {!loading && (
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="card-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      Attendance Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {attendance?.monthlyBreakdown && attendance.monthlyBreakdown.length > 0 ? (
                      <ChartContainer config={attendanceChartConfig} className="h-[220px] w-full">
                        <BarChart data={attendance.monthlyBreakdown}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="present" fill="var(--clr-green)" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="absent" fill="var(--clr-red)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ChartContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
                        No attendance data yet
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="card-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      Grade Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {grades?.gradeTrend && grades.gradeTrend.length > 0 ? (
                      <ChartContainer config={gradeChartConfig} className="h-[220px] w-full">
                        <BarChart data={grades.gradeTrend}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="title" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={50} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="percentage" fill="var(--clr-blue)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ChartContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
                        No graded assignments yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {!loading && (
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="card-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Recent Attendance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {attendance?.recentSessions && attendance.recentSessions.length > 0 ? (
                      <div className="space-y-2">
                        {attendance.recentSessions.map((s, i) => (
                          <div key={i} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2.5">
                            <div className="flex items-center gap-3">
                              <div className={`h-2 w-2 rounded-full ${s.status === "PRESENT" ? "bg-emerald-500" : "bg-red-500"}`} />
                              <div>
                                <p className="text-sm font-medium">
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
                      <p className="text-sm text-muted-foreground text-center py-8">No attendance records yet</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="card-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      Upcoming Assignments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {assignments?.upcoming && assignments.upcoming.length > 0 ? (
                      <div className="space-y-2">
                        {assignments.upcoming.map((a) => {
                          const daysLeft = Math.ceil(
                            (new Date(a.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                          );
                          return (
                            <div key={a.id} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2.5">
                              <div>
                                <p className="text-sm font-medium">{a.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  Due{" "}
                                  {new Date(a.dueDate).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </p>
                              </div>
                              <Badge
                                variant={daysLeft <= 2 ? "destructive" : "secondary"}
                                className="text-xs"
                              >
                                {daysLeft <= 0 ? "Due today" : `${daysLeft}d left`}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                        <p className="text-sm text-muted-foreground">All caught up!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </StudentShell>
  );
}
