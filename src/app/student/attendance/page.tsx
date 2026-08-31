"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { StudentShell } from "@/components/layout/student-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  CalendarCheck,
  CalendarX,
  CalendarDays,
  Percent,
  ClipboardCheck,
} from "lucide-react";
import { getStudentAttendance } from "@/lib/api";
import type { PortalAttendanceDTO } from "@/types/api";

const chartConfig = {
  present: { label: "Present", color: "var(--chart-2)" },
  absent: { label: "Absent", color: "var(--chart-4)" },
} satisfies ChartConfig;

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function StudentAttendance() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<PortalAttendanceDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      getStudentAttendance()
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

  const summary = data?.summary;
  const percentage = Math.round(summary?.percentage ?? 0);
  const records = data?.records ?? [];
  const sorted = [...records].sort((a, b) => new Date(b.session.date).getTime() - new Date(a.session.date).getTime());

  return (
    <StudentShell user={{ name: session.user.name || "", email: session.user.email || "" }}>
      <div className="page-stack">
        <div>
          <h2 className="page-title">My Attendance</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Your class attendance history (read-only).</p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          ) : (
            <>
              <StatCard
                label="Present"
                value={summary?.present ?? 0}
                icon={CalendarCheck}
                iconBg="bg-emerald-500/10 dark:bg-emerald-500/20"
                iconColor="text-emerald-600 dark:text-emerald-400"
              />
              <StatCard
                label="Absent"
                value={summary?.absent ?? 0}
                icon={CalendarX}
                iconBg="bg-rose-500/10 dark:bg-rose-500/20"
                iconColor="text-rose-600 dark:text-rose-400"
              />
              <StatCard
                label="Total Days"
                value={summary?.totalDays ?? 0}
                icon={CalendarDays}
                iconBg="bg-blue-500/10 dark:bg-blue-500/20"
                iconColor="text-blue-600 dark:text-blue-400"
              />
              <StatCard
                label="Attendance"
                value={`${percentage}%`}
                icon={Percent}
                iconBg="bg-amber-500/10 dark:bg-amber-500/20"
                iconColor="text-amber-600 dark:text-amber-400"
              />
            </>
          )}
        </div>

        {!loading && data?.monthlyBreakdown && data.monthlyBreakdown.length > 0 && (
          <div className="surface">
            <div className="surface-header">
              <h3 className="text-base font-semibold text-card-foreground">Monthly Attendance</h3>
              <p className="text-[13px] text-muted-foreground">Present vs absent per month.</p>
            </div>
            <div className="p-2.5">
              <ChartContainer config={chartConfig} className="h-[240px] w-full">
                <BarChart data={data.monthlyBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="present" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="absent" fill="var(--chart-4)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        )}

        <div className="surface">
          <div className="surface-header">
            <h3 className="text-base font-semibold text-card-foreground">Attendance History</h3>
            <p className="text-[13px] text-muted-foreground">Every recorded class session, most recent first.</p>
          </div>

          {loading ? (
            <div className="space-y-1 p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-11" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <ClipboardCheck className="mb-2 h-8 w-8" />
              <p className="text-sm">No attendance records yet.</p>
            </div>
          ) : (
            <div>
              {sorted.map((record, index) => (
                <div
                  key={record.id}
                  className={`flex items-center justify-between gap-2 p-2 hover:bg-muted ${
                    index < sorted.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                      <CalendarDays size={20} strokeWidth={1.75} />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-card-foreground">{formatDate(record.session.date)}</p>
                      <p className="text-xs text-muted-foreground">{record.session.class.name}</p>
                    </div>
                  </div>
                  <Badge variant={record.status === "PRESENT" ? "default" : "destructive"} className="text-xs">
                    {record.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StudentShell>
  );
}
