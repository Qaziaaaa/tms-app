"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { SearchBar } from "@/components/ui/search-bar";
import { MarkAttendanceDialog } from "@/components/attendance/mark-attendance-dialog";
import {
  Users, GraduationCap, ClipboardCheck, FileText, ArrowRight,
  AlertCircle, Plus, CalendarCheck, CheckCircle2, XCircle,
  BookOpen, TrendingUp,
} from "lucide-react";
import Link from "next/link";

interface DashboardData {
  totalClasses: number;
  totalStudents: number;
  totalSessions: number;
  totalAssignments: number;
  todayAttendance: { present: number; absent: number };
  recentAttendance: Array<{
    id: string;
    date: string;
    classId: { name: string };
    recordCount: number;
    presentCount: number;
  }>;
  classesWithStats: Array<{
    id: string;
    name: string;
    department: string;
    studentCount: number;
    sessionCount: number;
    averageAttendance: number;
  }>;
  recentStudents: Array<{
    id: string;
    name: string;
    email: string;
    classId?: { name: string };
  }>;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendanceSearch, setAttendanceSearch] = useState("");
  const [attendanceOpen, setAttendanceOpen] = useState(false);

  const loadDashboard = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to load dashboard");
      const json = await res.json();
      setData(json.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard data");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") loadDashboard();
  }, [status, router, loadDashboard]);

  const filteredAttendance = (data?.recentAttendance || []).filter((s) => {
    if (!attendanceSearch.trim()) return true;
    return s.classId?.name?.toLowerCase().includes(attendanceSearch.trim().toLowerCase());
  });

  if (status === "loading" || !session?.user) {
    return <div className="flex min-h-screen items-center justify-center"><Skeleton className="h-8 w-48" /></div>;
  }

  const todayPct = data && data.totalStudents > 0
    ? Math.round(((data.todayAttendance.present) / data.totalStudents) * 100)
    : 0;

  const avgAttendance = data?.classesWithStats?.length
    ? Math.round(data.classesWithStats.reduce((sum, c) => sum + c.averageAttendance, 0) / data.classesWithStats.length)
    : 0;

  return (
    <AppShell user={{ name: session.user.name || "", email: session.user.email || "" }}>
      <div className="grid gap-3">
        <div className="flex flex-col items-stretch justify-between gap-2 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back, {session.user.name?.split(" ")[0] || "Teacher"}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Real-time class performance, attendance rates, and student activity.
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="default" size="sm" className="h-9" onClick={() => setAttendanceOpen(true)}>
              <ClipboardCheck className="mr-1.5 h-4 w-4" /> Take Attendance
            </Button>
            <Link href="/classes">
              <Button variant="outline" size="sm" className="h-9">
                <Plus className="mr-1.5 h-4 w-4" /> New Class
              </Button>
            </Link>
          </div>
        </div>

        {error ? (
          <Card className="card-shadow border-destructive/20">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-10 w-10 text-destructive mb-3" />
              <p className="text-sm font-medium text-destructive">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => { setError(null); loadDashboard(); }}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-lg border bg-card p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 space-y-2">
                          <Skeleton className="h-3.5 w-24" />
                          <Skeleton className="h-7 w-16" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                      </div>
                    </div>
                  ))
                : (
                  <>
                    <StatCard
                      label="Total Students"
                      value={data?.totalStudents ?? 0}
                      subtitle={`${data?.totalClasses ?? 0} active classes`}
                      icon={GraduationCap}
                      iconBg="hsl(var(--clr-blue-bg))"
                      iconColor="hsl(var(--clr-blue))"
                    />
                    <StatCard
                      label="Attendance Today"
                      value={`${data?.todayAttendance.present ?? 0}/${data?.totalStudents ?? 0}`}
                      subtitle={`${todayPct}% attendance rate`}
                      subtitleColor={todayPct >= 75 ? "hsl(var(--clr-green))" : todayPct >= 50 ? "hsl(var(--clr-amber))" : "hsl(var(--clr-red))"}
                      icon={CalendarCheck}
                      iconBg="hsl(var(--clr-green-bg))"
                      iconColor="hsl(var(--clr-green))"
                    />
                    <StatCard
                      label="Avg Attendance"
                      value={`${avgAttendance}%`}
                      subtitle="Across all classes"
                      subtitleColor={avgAttendance >= 75 ? "hsl(var(--clr-green))" : "hsl(var(--clr-amber))"}
                      icon={TrendingUp}
                      iconBg="hsl(var(--clr-purple-bg))"
                      iconColor="hsl(var(--clr-purple))"
                    />
                    <StatCard
                      label="Sessions Held"
                      value={data?.totalSessions ?? 0}
                      subtitle={`${data?.totalAssignments ?? 0} assignments`}
                      icon={ClipboardCheck}
                      iconBg="hsl(var(--clr-amber-bg))"
                      iconColor="hsl(var(--clr-amber))"
                    />
                  </>
                )
              }
            </div>

            <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
              <div className="min-w-0 rounded-lg border bg-card shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                  <div>
                    <h3 className="text-base font-semibold">Recent Sessions</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">Latest attendance records across your classes</p>
                  </div>
                  <SearchBar
                    value={attendanceSearch}
                    onChange={setAttendanceSearch}
                    placeholder="Search class..."
                    className="w-full sm:w-[180px]"
                    delay={200}
                  />
                </div>
                <div className="h-[380px] w-full max-w-full overflow-auto border-t">
                  <table className="w-full min-w-[400px] text-sm" style={{ tableLayout: "fixed" }}>
                    <thead>
                      <tr>
                        <th className="w-[40%] px-4 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Class</th>
                        <th className="w-[22%] px-4 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Date</th>
                        <th className="w-[18%] px-4 py-1.5 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Present</th>
                        <th className="w-[20%] px-4 py-1.5 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Attendance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                          <tr key={i} className="h-12 border-b last:border-0">
                            <td colSpan={4} className="px-4"><Skeleton className="h-4 w-full" /></td>
                          </tr>
                        ))
                      ) : filteredAttendance.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-xs text-muted-foreground">No attendance sessions yet</td></tr>
                      ) : (
                        filteredAttendance.map((s) => {
                          const pct = s.recordCount > 0 ? Math.round((s.presentCount / s.recordCount) * 100) : 0;
                          return (
                            <tr key={s.id} className="h-12 border-b last:border-0 hover:bg-muted/50">
                              <td className="px-4 py-1.5">
                                <div className="flex min-w-0 items-center gap-1.5">
                                  <BookOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                  <span className="truncate text-xs font-medium">{s.classId?.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-1.5">
                                <span className="truncate text-xs text-muted-foreground">
                                  {new Date(s.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                                </span>
                              </td>
                              <td className="px-4 py-1.5 text-center">
                                <span className="text-xs font-medium">{s.presentCount}/{s.recordCount}</span>
                              </td>
                              <td className="px-4 py-1.5 text-right">
                                <Badge
                                  variant="secondary"
                                  className={`text-[10px] ${pct >= 75 ? "bg-green-50 text-green-700 border-green-200" : pct >= 50 ? "bg-yellow-50 text-yellow-700 border-yellow-200" : "bg-red-50 text-red-700 border-red-200"}`}
                                >
                                  {pct}%
                                </Badge>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="min-w-0 rounded-lg border bg-card shadow-sm">
                <div className="flex items-center justify-between p-3">
                  <div>
                    <h3 className="text-base font-semibold">Recent Students</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">Newly added students</p>
                  </div>
                  <Link href="/students">
                    <Button variant="ghost" size="sm" className="gap-0.5 text-xs h-auto p-1">
                      View All <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
                <div className="border-t">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2.5 border-b last:border-0">
                        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                        <div className="flex-1 space-y-1"><Skeleton className="h-3.5 w-3/4" /><Skeleton className="h-2.5 w-1/2" /></div>
                      </div>
                    ))
                  ) : (data?.recentStudents || []).length === 0 ? (
                    <p className="px-4 py-8 text-center text-xs text-muted-foreground">No students yet</p>
                  ) : (
                    data?.recentStudents.map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-2 px-3 py-2.5 border-b last:border-0 hover:bg-muted/50">
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-clr-blue text-[11px] font-semibold text-white">
                            {s.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium">{s.name}</p>
                            <p className="truncate text-[10px] text-muted-foreground">{s.classId?.name || "Unassigned"}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="min-w-0 rounded-lg border bg-card shadow-sm">
              <div className="flex items-center justify-between p-3">
                <div>
                  <h3 className="text-base font-semibold">Your Classes</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">Class overview with attendance performance</p>
                </div>
                <Link href="/classes">
                  <Button variant="ghost" size="sm" className="gap-0.5 text-xs h-auto p-1">
                    Manage <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
              <div className="grid gap-2 p-3 pt-0 sm:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)
                ) : (data?.classesWithStats || []).length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground col-span-full">No classes yet. Create one to get started.</p>
                ) : (
                  data?.classesWithStats.map((cls) => (
                    <div key={cls.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{cls.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {cls.studentCount} students &middot; {cls.sessionCount} sessions
                        </p>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full ${cls.averageAttendance >= 75 ? "bg-green-500" : cls.averageAttendance >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                              style={{ width: `${Math.min(cls.averageAttendance, 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-muted-foreground">{cls.averageAttendance}%</span>
                        </div>
                      </div>
                      <Link href={`/attendance?classId=${cls.id}`}>
                        <Button size="sm" variant="ghost" className="gap-1 text-xs">
                          <ClipboardCheck className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <MarkAttendanceDialog open={attendanceOpen} onClose={() => setAttendanceOpen(false)} onSaved={() => loadDashboard(false)} />
    </AppShell>
  );
}
