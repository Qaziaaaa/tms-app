"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, GraduationCap, ClipboardCheck, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";

interface DashboardData {
  totalClasses: number;
  totalStudents: number;
  totalSessions: number;
  totalAssignments: number;
  recentAttendance: Array<{
    _id: string;
    date: string;
    classId: { name: string };
    _count: { records: number };
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

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      fetch("/api/dashboard")
        .then((r) => {
          if (!r.ok) throw new Error("Failed to load dashboard");
          return r.json();
        })
        .then((json) => setData(json.data))
        .catch(() => {})
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

  const stats = data
    ? [
        { title: "Classes", value: data.totalClasses, icon: Users },
        { title: "Students", value: data.totalStudents, icon: GraduationCap },
        { title: "Sessions", value: data.totalSessions, icon: ClipboardCheck },
        { title: "Assignments", value: data.totalAssignments, icon: FileText },
      ]
    : [];

  return (
    <AppShell user={{ name: session.user.name || "", email: session.user.email || "" }}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
            : stats.map((s) => (
                <Card key={s.title}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <s.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{s.title}</p>
                      <p className="text-2xl font-bold">{s.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Classes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)
              ) : data?.classesWithStats.length === 0 ? (
                <p className="text-sm text-muted-foreground">No classes yet. Create one to get started.</p>
              ) : (
                data?.classesWithStats.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{cls.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {cls.studentCount} students &middot; {cls.sessionCount} sessions
                        {cls.averageAttendance > 0 && ` \u00b7 ${cls.averageAttendance}% attendance`}
                      </p>
                    </div>
                    <Link href={`/attendance?classId=${cls.id}`}>
                      <Button size="sm" variant="outline">
                        Take Attendance <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Sessions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)
              ) : data?.recentAttendance.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attendance sessions yet.</p>
              ) : (
                data?.recentAttendance.map((s) => (
                  <div key={s._id} className="flex items-center justify-between rounded-lg border p-3">
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
                    <Badge variant="secondary">{s._count.records} records</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
