"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, GraduationCap, ClipboardCheck, FileText, ArrowRight, AlertCircle } from "lucide-react";
import Link from "next/link";

interface DashboardData {
  totalClasses: number;
  totalStudents: number;
  totalSessions: number;
  totalAssignments: number;
  recentAttendance: Array<{
    id: string;
    date: string;
    classId: { name: string };
    recordCount: number;
  }>;
  classesWithStats: Array<{
    id: string;
    name: string;
    studentCount: number;
    sessionCount: number;
    averageAttendance: number;
  }>;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      fetch("/api/dashboard")
        .then((r) => {
          if (!r.ok) throw new Error("Failed to load dashboard");
          return r.json();
        })
        .then((json) => setData(json.data))
        .catch((e) => setError(e.message || "Failed to load dashboard data"))
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  if (status === "loading" || !session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-6 w-32" />
        </div>
      </div>
    );
  }

  const stats = data
    ? [
        { title: "CLASSES", value: data.totalClasses, icon: Users, color: "bg-blue-500/10 text-blue-600" },
        { title: "STUDENTS", value: data.totalStudents, icon: GraduationCap, color: "bg-green-500/10 text-green-600" },
        { title: "SESSIONS", value: data.totalSessions, icon: ClipboardCheck, color: "bg-purple-500/10 text-purple-600" },
        { title: "ASSIGNMENTS", value: data.totalAssignments, icon: FileText, color: "bg-orange-500/10 text-orange-600" },
      ]
    : [];

  return (
    <AppShell user={{ name: session.user.name || "", email: session.user.email || "" }}>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {session.user.name?.split(" ")[0] || "Teacher"}
          </h1>
          <p className="text-muted-foreground mt-1">Here&apos;s an overview of your teaching activity</p>
        </div>

        {error ? (
          <Card className="card-shadow border-destructive/20">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-10 w-10 text-destructive mb-3" />
              <p className="text-sm font-medium text-destructive">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => { setError(null); setLoading(true); fetch("/api/dashboard").then(r => { if (!r.ok) throw new Error("Failed to load dashboard"); return r.json(); }).then(json => setData(json.data)).catch(e => setError(e.message || "Failed to load dashboard data")).finally(() => setLoading(false)); }}>
                Try Again
              </Button>
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
                : stats.map((s) => (
                    <Card key={s.title} className="card-shadow card-hover group cursor-default">
                      <CardContent className="flex items-start gap-4 p-5">
                        <div className={`rounded-xl p-3 ${s.color}`}>
                          <s.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.title}</p>
                          <p className="text-2xl font-bold mt-0.5">{s.value}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">Your Classes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)
                  ) : data?.classesWithStats.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No classes yet. Create one to get started.</p>
                  ) : (
                    data?.classesWithStats.map((cls) => (
                      <div key={cls.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                        <div>
                          <p className="font-medium">{cls.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {cls.studentCount} students &middot; {cls.sessionCount} sessions
                            {cls.averageAttendance > 0 && ` \u00b7 ${cls.averageAttendance}% attendance`}
                          </p>
                        </div>
                        <Link href={`/attendance?classId=${cls.id}`}>
                          <Button size="sm" variant="ghost" className="gap-1">
                            Take Attendance <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Sessions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)
                  ) : data?.recentAttendance.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No attendance sessions yet.</p>
                  ) : (
                    data?.recentAttendance.map((s) => (
                      <div key={s.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                        <div>
                          <p className="font-medium">{s.classId?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(s.date).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <Badge variant="secondary">{s.recordCount} records</Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
