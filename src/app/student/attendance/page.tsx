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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClipboardCheck, Flame, TrendingUp } from "lucide-react";
import { getStudentAttendance } from "@/lib/api";
import type { PortalAttendanceDTO } from "@/types/api";

const chartConfig = {
  present: { label: "Present", color: "var(--clr-green)" },
  absent: { label: "Absent", color: "var(--clr-red)" },
} satisfies ChartConfig;

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

  return (
    <StudentShell user={{ name: session.user.name || "", email: session.user.email || "" }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Attendance</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track your attendance history and streaks</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
            : data?.summary && (
                <>
                  <Card className="card-shadow">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="rounded-xl bg-emerald-500/10 p-3">
                        <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Present</p>
                        <p className="text-2xl font-bold">{data.summary.present}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="card-shadow">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="rounded-xl bg-red-500/10 p-3">
                        <ClipboardCheck className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Absent</p>
                        <p className="text-2xl font-bold">{data.summary.absent}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="card-shadow">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="rounded-xl bg-orange-500/10 p-3">
                        <Flame className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Streak</p>
                        <p className="text-2xl font-bold">{data.streak?.current ?? 0} days</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="card-shadow">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="rounded-xl bg-blue-500/10 p-3">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Attendance Rate</p>
                        <p className="text-2xl font-bold">{data.summary.percentage}%</p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
        </div>

        {!loading && data?.monthlyBreakdown && data.monthlyBreakdown.length > 0 && (
          <Card className="card-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Monthly Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[260px] w-full">
                <BarChart data={data.monthlyBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="present" fill="var(--clr-green)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absent" fill="var(--clr-red)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        <Card className="card-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Attendance History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : data?.records.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No attendance records yet.</p>
            ) : (
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Class</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {new Date(record.session.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell>{record.session.class.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={record.status === "PRESENT" ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {record.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StudentShell>
  );
}
