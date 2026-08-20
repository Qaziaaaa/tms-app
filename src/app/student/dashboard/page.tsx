"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { StudentShell } from "@/components/layout/student-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardCheck, FileText, BarChart3, TrendingUp, AlertCircle } from "lucide-react";

interface Profile {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  class: { id: string; name: string; department: string; batch: string };
}

interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  totalDays: number;
  percentage: number;
}

interface GradesSummary {
  totalMarksObtained: number;
  totalPossibleMarks: number;
  overallPercentage: number;
}

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [grades, setGrades] = useState<GradesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      Promise.all([
        fetch("/api/student/profile").then((r) => { if (!r.ok) throw new Error("Failed to load profile"); return r.json(); }),
        fetch("/api/student/attendance").then((r) => { if (!r.ok) throw new Error("Failed to load attendance"); return r.json(); }),
        fetch("/api/student/grades").then((r) => { if (!r.ok) throw new Error("Failed to load grades"); return r.json(); }),
      ]).then(([profileRes, attendanceRes, gradesRes]) => {
        setProfile(profileRes.data);
        setAttendance(attendanceRes.data?.summary || null);
        setGrades(gradesRes.data?.summary || null);
        setLoading(false);
      }).catch((e) => {
        setError(e.message || "Failed to load dashboard data");
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

  const stats = attendance && grades
    ? [
        { title: "ATTENDANCE", value: `${attendance.percentage}%`, icon: ClipboardCheck, color: "bg-blue-500/10 text-blue-600", detail: `${attendance.present}/${attendance.totalDays} days` },
        { title: "ASSIGNMENTS", value: `${grades.totalMarksObtained}/${grades.totalPossibleMarks}`, icon: FileText, color: "bg-green-500/10 text-green-600", detail: `${grades.overallPercentage}% average` },
        { title: "OVERALL GRADE", value: `${grades.overallPercentage}%`, icon: TrendingUp, color: "bg-purple-500/10 text-purple-600", detail: grades.overallPercentage >= 70 ? "Passing" : "Needs improvement" },
        { title: "TOTAL DAYS", value: attendance.totalDays, icon: BarChart3, color: "bg-orange-500/10 text-orange-600", detail: `${attendance.absent} absent` },
      ]
    : [];

  return (
    <StudentShell user={{ name: session.user.name || "", email: session.user.email || "" }}>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome, {profile?.name || session.user.name}
          </h1>
          {profile && (
            <p className="text-muted-foreground mt-0.5">
              {profile.class.name} &middot; Roll #{profile.rollNumber}
            </p>
          )}
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
                : stats.map((s) => (
                    <Card key={s.title} className="card-shadow card-hover group cursor-default">
                      <CardContent className="flex items-start gap-4 p-5">
                        <div className={`rounded-xl p-3 transition-transform duration-200 group-hover:scale-110 ${s.color}`}>
                          <s.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.title}</p>
                          <p className="text-2xl font-bold mt-0.5">{s.value}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{s.detail}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
            </div>

            {!loading && attendance && (
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="card-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">Attendance Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Present</span>
                      <Badge variant="default">{attendance.present}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Absent</span>
                      <Badge variant="destructive">{attendance.absent}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Late</span>
                      <Badge variant="secondary">{attendance.late}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Percentage</span>
                      <Badge variant={attendance.percentage >= 75 ? "default" : "destructive"}>
                        {attendance.percentage}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">Class Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {profile && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Class</span>
                          <span className="text-sm font-medium">{profile.class.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Department</span>
                          <span className="text-sm font-medium">{profile.class.department}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Batch</span>
                          <span className="text-sm font-medium">{profile.class.batch}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Roll Number</span>
                          <span className="text-sm font-medium">{profile.rollNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Email</span>
                          <span className="text-sm font-medium">{profile.email}</span>
                        </div>
                      </>
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
