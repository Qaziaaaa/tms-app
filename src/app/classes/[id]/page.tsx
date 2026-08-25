"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchBar } from "@/components/ui/search-bar";
import { ArrowLeft, Users, ClipboardCheck, TrendingUp, BookOpen } from "lucide-react";
import Link from "next/link";
import { getClassById } from "@/lib/api";
import { getErrorMessage } from "@/hooks/use-api-data";
import type { ClassDetailDTO } from "@/types/api";

export default function ClassDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const classId = params.id as string;
  const [data, setData] = useState<ClassDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && classId) fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, router, classId]);

  async function fetchDetail() {
    try {
      setLoading(true);
      setData(await getClassById(classId));
    } catch (err) {
      setError(getErrorMessage(err));
    }
    setLoading(false);
  }

  const filteredStudents = (data?.students || []).filter((s) => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.trim().toLowerCase();
    return s.name.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q);
  });

  if (status === "loading" || !session?.user) {
    return <div className="flex min-h-screen items-center justify-center"><Skeleton className="h-8 w-48" /></div>;
  }

  return (
    <AppShell user={{ name: session.user.name || "", email: session.user.email || "" }}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/classes">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {loading ? "Loading..." : data?.class.name || "Class not found"}
            </h1>
            {!loading && data && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {data.class.department} &middot; Batch {data.class.batch}
                {data.class.schedule && <> &middot; {data.class.schedule}</>}
              </p>
            )}
          </div>
        </div>

        {error ? (
          <Card className="card-shadow border-destructive/20">
            <CardContent className="py-12 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={fetchDetail}>Try Again</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
              ) : (
                <>
                  <StatCard label="Students" value={data?.totalStudents ?? 0} icon={Users} iconBg="hsl(var(--clr-blue-bg))" iconColor="hsl(var(--clr-blue))" />
                  <StatCard label="Sessions Held" value={data?.totalSessions ?? 0} subtitle={`${data?.totalAssignments ?? 0} assignments`} icon={ClipboardCheck} iconBg="hsl(var(--clr-amber-bg))" iconColor="hsl(var(--clr-amber))" />
                  <StatCard
                    label="Avg Attendance"
                    value={`${data?.averageAttendance ?? 0}%`}
                    subtitleColor={data && data.averageAttendance >= 75 ? "hsl(var(--clr-green))" : data && data.averageAttendance >= 50 ? "hsl(var(--clr-amber))" : "hsl(var(--clr-red))"}
                    icon={TrendingUp}
                    iconBg="hsl(var(--clr-green-bg))"
                    iconColor="hsl(var(--clr-green))"
                  />
                  <StatCard
                    label="Avg Marks"
                    value={`${data?.averageMarks ?? 0}%`}
                    subtitleColor={data && data.averageMarks >= 75 ? "hsl(var(--clr-green))" : data && data.averageMarks >= 50 ? "hsl(var(--clr-amber))" : "hsl(var(--clr-red))"}
                    icon={BookOpen}
                    iconBg="hsl(var(--clr-purple-bg))"
                    iconColor="hsl(var(--clr-purple))"
                  />
                </>
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="card-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Recent Sessions</CardTitle>
                    <Link href={`/attendance?classId=${classId}`}>
                      <Button variant="ghost" size="sm" className="text-xs">View All</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
                  ) : (data?.recentSessions || []).length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No sessions yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {data!.recentSessions.map((s) => {
                        const pct = s.recordCount > 0 ? Math.round((s.presentCount / s.recordCount) * 100) : 0;
                        return (
                          <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                              <p className="text-sm font-medium">
                                {new Date(s.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                              </p>
                              <p className="text-xs text-muted-foreground">{s.presentCount}/{s.recordCount} present</p>
                            </div>
                            <Badge variant="secondary" className={`text-[10px] ${pct >= 75 ? "bg-green-50 text-green-700 border-green-200" : pct >= 50 ? "bg-yellow-50 text-yellow-700 border-yellow-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                              {pct}%
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="card-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Recent Assignments</CardTitle>
                    <Link href={`/assignments?classId=${classId}`}>
                      <Button variant="ghost" size="sm" className="text-xs">View All</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
                  ) : (data?.recentAssignments || []).length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No assignments yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {data!.recentAssignments.map((a) => (
                        <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <p className="text-sm font-medium">{a.title}</p>
                            <p className="text-xs text-muted-foreground">Due {new Date(a.dueDate).toLocaleDateString()} &middot; {a.totalMarks} marks</p>
                          </div>
                          <Badge variant="secondary">{a.submissionCount} submitted</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="card-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Student Roster</CardTitle>
                  <span className="text-sm text-muted-foreground">{data?.totalStudents ?? 0} students</span>
                </div>
                <div className="mt-2">
                  <SearchBar value={studentSearch} onChange={setStudentSearch} placeholder="Search students..." delay={200} />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-40" />
                ) : filteredStudents.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {(data?.students || []).length === 0 ? "No students in this class." : "No students match your search."}
                  </p>
                ) : (
                  <div className="max-h-[400px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Roll</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead className="text-right">Attendance</TableHead>
                          <TableHead className="text-right">Avg Marks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell><Badge variant="outline">{s.rollNumber}</Badge></TableCell>
                            <TableCell className="font-medium">{s.name}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary" className={`text-[10px] ${s.attendancePct >= 75 ? "bg-green-50 text-green-700 border-green-200" : s.attendancePct >= 50 ? "bg-yellow-50 text-yellow-700 border-yellow-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                                {s.attendancePct}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-sm">{s.avgMarks > 0 ? `${s.avgMarks}%` : "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
