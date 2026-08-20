"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3 } from "lucide-react";

interface ClassItem { id: string; name: string; department: string; }
interface AttendanceReport { id: string; rollNumber: string; name: string; totalSessions: number; presentCount: number; attendancePercentage: number; }
interface SubmissionReport { id: string; rollNumber: string; name: string; totalAssignments: number; submittedCount: number; notSubmittedCount: number; averageMarks: number; }

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [reportType, setReportType] = useState<"attendance" | "submissions">("attendance");
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<AttendanceReport[] | SubmissionReport[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      fetch("/api/classes").then(r => r.json()).then((json) => {
        const data = json.data as ClassItem[];
        setClasses(data);
        setLoading(false);
        if (data.length > 0) setSelectedClassId(data[0].id);
      });
    }
  }, [status, router]);

  useEffect(() => {
    if (selectedClassId) fetchReport();
  }, [selectedClassId, reportType]);

  async function fetchReport() {
    if (!selectedClassId) return;
    setLoadingReport(true);
    setReportData([]);
    const res = await fetch(`/api/reports?classId=${selectedClassId}&type=${reportType}`);
    if (res.ok) {
      const json = await res.json();
      setReportData(json.data.students || []);
    } else setReportData([]);
    setLoadingReport(false);
  }

  function getAttBadge(pct: number) {
    if (pct >= 80) return <Badge className="bg-green-600 hover:bg-green-700">{pct}%</Badge>;
    if (pct >= 60) return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">{pct}%</Badge>;
    return <Badge className="bg-red-600 hover:bg-red-700">{pct}%</Badge>;
  }

  if (status === "loading" || !session?.user) {
    return <div className="flex min-h-screen items-center justify-center"><Skeleton className="h-8 w-48" /></div>;
  }

  return (
    <AppShell user={{ name: session.user.name || "", email: session.user.email || "" }}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Reports</h1>
        </div>

        <div className="flex flex-wrap gap-3">
          {loading ? <Skeleton className="h-10 w-64" /> : (
            <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
              {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.department}</option>)}
            </select>
          )}
          <div className="flex rounded-lg border border-input overflow-hidden">
            <button
              onClick={() => { setReportData([]); setReportType("attendance"); }}
              className={`px-4 py-2 text-sm font-medium transition-colors ${reportType === "attendance" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent"}`}
            >
              Attendance
            </button>
            <button
              onClick={() => { setReportData([]); setReportType("submissions"); }}
              className={`px-4 py-2 text-sm font-medium transition-colors ${reportType === "submissions" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent"}`}
            >
              Submissions
            </button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {reportType === "attendance" ? "Attendance Report" : "Submissions Report"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingReport ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : reportData.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">No data available for this class.</p>
            ) : reportType === "attendance" ? (
              <div className="max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-center">Attended</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-right">Attendance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(reportData as AttendanceReport[]).map(r => (
                      <TableRow key={r.id}>
                        <TableCell><Badge variant="outline">{r.rollNumber}</Badge></TableCell>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell className="text-center">{r.presentCount}</TableCell>
                        <TableCell className="text-center">{r.totalSessions}</TableCell>
                        <TableCell className="text-right">{getAttBadge(r.attendancePercentage)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-center">Submitted</TableHead>
                      <TableHead className="text-center">Missing</TableHead>
                      <TableHead className="text-right">Avg Marks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(reportData as SubmissionReport[]).map(r => (
                      <TableRow key={r.id}>
                        <TableCell><Badge variant="outline">{r.rollNumber}</Badge></TableCell>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell className="text-center"><Badge className="bg-green-600">{r.submittedCount}</Badge></TableCell>
                        <TableCell className="text-center"><Badge className="bg-red-600">{r.notSubmittedCount}</Badge></TableCell>
                        <TableCell className="text-right font-medium">{r.averageMarks.toFixed(1)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
