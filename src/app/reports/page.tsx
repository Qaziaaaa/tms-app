"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchBar } from "@/components/ui/search-bar";
import { BarChart3 } from "lucide-react";
import { getClasses, getReport } from "@/lib/api";
import type {
  ClassDTO,
  AttendanceReportRow,
  SubmissionReportRow,
  ReportType,
} from "@/types/api";

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState<ClassDTO[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [reportType, setReportType] = useState<ReportType>("attendance");
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<AttendanceReportRow[] | SubmissionReportRow[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    if (!search.trim()) return reportData;
    const q = search.trim().toLowerCase();
    return reportData.filter(
      (r) => r.name.toLowerCase().includes(q) || r.rollNumber.toLowerCase().includes(q)
    );
  }, [reportData, search]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      getClasses()
        .then((data) => {
          setClasses(data);
          if (data.length > 0) setSelectedClassId(data[0].id);
        })
        .catch(() => setClasses([]))
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  useEffect(() => {
    if (selectedClassId) fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, reportType]);

  async function fetchReport() {
    if (!selectedClassId) return;
    setLoadingReport(true);
    setReportData([]);
    try {
      const report = await getReport(selectedClassId, reportType);
      setReportData(report.students || []);
    } catch {
      setReportData([]);
    }
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
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          </div>
          <p className="text-muted-foreground mt-0.5 ml-8">View attendance and submission reports for your classes</p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center">
          {loading ? <Skeleton className="h-10 w-64" /> : (
            <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm">
              {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.department}</option>)}
            </select>
          )}
          <div className="flex rounded-lg border border-input overflow-hidden">
            <button
              onClick={() => { setReportData([]); setReportType("attendance"); setSearch(""); }}
              className={`px-4 py-2 text-sm font-medium transition-colors ${reportType === "attendance" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent"}`}
            >
              Attendance
            </button>
            <button
              onClick={() => { setReportData([]); setReportType("submissions"); setSearch(""); }}
              className={`px-4 py-2 text-sm font-medium transition-colors ${reportType === "submissions" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent"}`}
            >
              Submissions
            </button>
          </div>
          {!loadingReport && reportData.length > 0 && (
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by name or roll..."
              delay={200}
            />
          )}
        </div>

        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              {reportType === "attendance" ? "Attendance Report" : "Submissions Report"}
              {!loadingReport && reportData.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  {search.trim() ? `${filteredData.length} of ${reportData.length}` : `${reportData.length} students`}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingReport ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : filteredData.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">
                {reportData.length === 0 ? "No data available for this class." : "No students match your search."}
              </p>
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
                    {(filteredData as AttendanceReportRow[]).map(r => (
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
                    {(filteredData as SubmissionReportRow[]).map(r => (
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
