"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { StudentShell } from "@/components/layout/student-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardCheck, FileText, BarChart3, TrendingUp } from "lucide-react";

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

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      Promise.all([
        fetch("/api/student/profile").then((r) => r.json()),
        fetch("/api/student/attendance").then((r) => r.json()),
        fetch("/api/student/grades").then((r) => r.json()),
      ]).then(([profileRes, attendanceRes, gradesRes]) => {
        setProfile(profileRes.data);
        setAttendance(attendanceRes.data?.summary || null);
        setGrades(gradesRes.data?.summary || null);
        setLoading(false);
      });
    }
  }, [status, router]);

  if (status === "loading" || !session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  const stats = attendance && grades
    ? [
        { title: "Attendance", value: `${attendance.percentage}%`, icon: ClipboardCheck, detail: `${attendance.present}/${attendance.totalDays} days` },
        { title: "Assignments", value: `${grades.totalMarksObtained}/${grades.totalPossibleMarks}`, icon: FileText, detail: `${grades.overallPercentage}% average` },
        { title: "Overall Grade", value: `${grades.overallPercentage}%`, icon: TrendingUp, detail: grades.overallPercentage >= 70 ? "Passing" : "Needs improvement" },
        { title: "Total Days", value: attendance.totalDays, icon: BarChart3, detail: `${attendance.absent} absent` },
      ]
    : [];

  return (
    <StudentShell user={{ name: session.user.name || "", email: session.user.email || "" }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {profile?.name || session.user.name}</h1>
          {profile && (
            <p className="text-muted-foreground">
              {profile.class.name} &middot; Roll #{profile.rollNumber}
            </p>
          )}
        </div>

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
                      <p className="text-xs text-muted-foreground">{s.detail}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>

        {!loading && attendance && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
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

            <Card>
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
      </div>
    </StudentShell>
  );
}
