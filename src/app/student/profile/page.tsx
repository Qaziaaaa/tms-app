"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StudentShell } from "@/components/layout/student-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  GraduationCap,
  Mail,
  Calendar,
  BookOpen,
  ClipboardCheck,
  FileText,
  TrendingUp,
  KeyRound,
  IdCard,
  Building2,
  Clock,
  ChevronRight,
} from "lucide-react";
import { getStudentProfile } from "@/lib/api";
import { getInitials } from "@/lib/utils";
import type { PortalProfileDTO } from "@/types/api";

export default function StudentProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<PortalProfileDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      getStudentProfile()
        .then(setProfile)
        .catch(() => setProfile(null))
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

  const name = profile?.name || session.user.name || "Student";
  const email = profile?.email || session.user.email || "";
  const rollNumber = profile?.rollNumber || "N/A";
  const classInfo = profile?.class;
  const stats = profile?.stats;

  const joinedDate = profile?.joinedAt
    ? new Date(profile.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Active Student";

  return (
    <StudentShell user={{ name, email }}>
      <div className="page-stack">
        <div>
          <h2 className="page-title">My Profile</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Your academic identification and enrolled enrollment summary.
          </p>
        </div>

        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 ring-4 ring-primary/10 shrink-0">
                <AvatarFallback className="text-xl sm:text-2xl font-bold bg-primary/10 text-primary">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight text-card-foreground truncate">{name}</h3>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {rollNumber}
                  </Badge>
                  <Badge className="gap-1 bg-gradient-to-r from-black via-zinc-800 to-zinc-700 text-white border border-zinc-700/80 shadow-xs">
                    <GraduationCap className="h-3 w-3" />
                    Student
                  </Badge>
                </div>
                <p className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground truncate">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{email}</span>
                </p>
                <p className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  Enrolled since {joinedDate}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link href="/student/password" className="w-full sm:w-auto">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs w-full sm:w-auto">
                  <KeyRound className="h-3.5 w-3.5" />
                  Change Password
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Academic Performance Summary Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          ) : (
            <>
              <StatCard
                label="Attendance Rate"
                value={`${stats?.attendancePercentage ?? 0}%`}
                subtitle={`${stats?.presentCount ?? 0} of ${stats?.totalDays ?? 0} days present`}
                subtitleColor="var(--chart-2)"
                icon={ClipboardCheck}
                iconBg="bg-emerald-500/10 dark:bg-emerald-500/20"
                iconColor="text-emerald-600 dark:text-emerald-400"
              />
              <StatCard
                label="Overall Average"
                value={`${stats?.overallPercentage ?? 0}%`}
                subtitle={(stats?.overallPercentage ?? 0) >= 60 ? "Good standing" : "Academic warning"}
                subtitleColor={(stats?.overallPercentage ?? 0) >= 60 ? "var(--chart-2)" : "var(--chart-3)"}
                icon={TrendingUp}
                iconBg="bg-blue-500/10 dark:bg-blue-500/20"
                iconColor="text-blue-600 dark:text-blue-400"
              />
              <StatCard
                label="Assignments Done"
                value={`${stats?.submittedCount ?? 0} / ${stats?.totalAssignments ?? 0}`}
                subtitle="completed tasks"
                subtitleColor="var(--chart-5)"
                icon={FileText}
                iconBg="bg-purple-500/10 dark:bg-purple-500/20"
                iconColor="text-purple-600 dark:text-purple-400"
              />
              <StatCard
                label="Enrolled Class"
                value={classInfo?.name ? classInfo.name.split(" ")[0] : "Assigned"}
                subtitle={classInfo?.department || "Active Class"}
                subtitleColor="var(--chart-1)"
                icon={BookOpen}
                iconBg="bg-indigo-500/10 dark:bg-indigo-500/20"
                iconColor="text-indigo-600 dark:text-indigo-400"
              />
            </>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Academic & Class Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <IdCard className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Academic Information</CardTitle>
              </div>
              <CardDescription>Details regarding your class enrollment and student record.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 rounded-lg bg-muted/40 p-4 border border-border">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Student Name</p>
                  <p className="mt-1 text-sm font-medium text-card-foreground">{name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Roll Number</p>
                  <p className="mt-1 text-sm font-mono font-medium text-card-foreground">{rollNumber}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Class Name</p>
                  <p className="mt-1 text-sm font-medium text-card-foreground">{classInfo?.name || "Not Assigned"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department</p>
                  <p className="mt-1 text-sm font-medium text-card-foreground flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    {classInfo?.department || "Computer Science"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Batch</p>
                  <p className="mt-1 text-sm font-medium text-card-foreground">{classInfo?.batch || "2024"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Class Schedule</p>
                  <p className="mt-1 text-sm font-medium text-card-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {classInfo?.schedule || "Weekly"}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Institutional Email</p>
                <p className="text-sm font-mono text-card-foreground">{email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Navigation & Portal Links */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Portal Quick Links</CardTitle>
              </div>
              <CardDescription>Direct shortcuts to your academic records and portal activities.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <Link
                href="/student/attendance"
                className="flex items-center justify-between rounded-lg border border-border p-3.5 transition-colors hover:bg-muted/70"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                    <ClipboardCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-card-foreground">My Attendance History</p>
                    <p className="text-xs text-muted-foreground">View full session breakdown and percentages</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>

              <Link
                href="/student/assignments"
                className="flex items-center justify-between rounded-lg border border-border p-3.5 transition-colors hover:bg-muted/70"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-500/10 p-2 text-purple-600 dark:text-purple-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-card-foreground">My Assignments</p>
                    <p className="text-xs text-muted-foreground">Track submission status and upcoming deadlines</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>

              <Link
                href="/student/grades"
                className="flex items-center justify-between rounded-lg border border-border p-3.5 transition-colors hover:bg-muted/70"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-card-foreground">My Grades & Performance</p>
                    <p className="text-xs text-muted-foreground">View grade distribution and scored assignments</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>

              <Link
                href="/student/password"
                className="flex items-center justify-between rounded-lg border border-border p-3.5 transition-colors hover:bg-muted/70"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-card-foreground">Security & Password</p>
                    <p className="text-xs text-muted-foreground">Update your portal login password</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </StudentShell>
  );
}
