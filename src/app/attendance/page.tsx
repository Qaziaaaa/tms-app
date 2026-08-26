"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SearchBar } from "@/components/ui/search-bar";
import { localDateKey } from "@/lib/utils";
import { Plus, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  getStudents,
  getSessions,
  getSessionById,
  createSession as createSessionApi,
  deleteSession as deleteSessionApi,
  saveAttendanceRecords,
} from "@/lib/api";
import { useAuthAndClasses } from "@/hooks/use-auth-and-classes";
import { getErrorMessage } from "@/hooks/use-api-data";
import type { StudentDTO, AttendanceSessionDTO } from "@/types/api";

interface RecordItem { studentId: string; status: "PRESENT" | "ABSENT"; }

function AttendanceContent() {
  const searchParams = useSearchParams();
  const preselectedClass = searchParams.get("classId") || "";
  const { session, status, classes, selectedClassId, setSelectedClassId, loading } = useAuthAndClasses(preselectedClass);

  const [sessions, setSessions] = useState<AttendanceSessionDTO[]>([]);
  const [students, setStudents] = useState<StudentDTO[]>([]);
  const [activeSession, setActiveSession] = useState<AttendanceSessionDTO | null>(null);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "UNMARKED" | "PRESENT" | "ABSENT">("ALL");

  const markedCount = useMemo(() => {
    return students.filter((s) => records.some((r) => r.studentId === s.id)).length;
  }, [students, records]);

  const presentCount = useMemo(() => records.filter((r) => r.status === "PRESENT").length, [records]);
  const absentCount = useMemo(() => records.filter((r) => r.status === "ABSENT").length, [records]);

  const filteredStudents = useMemo(() => {
    let result = students;
    if (studentSearch.trim()) {
      const q = studentSearch.trim().toLowerCase();
      result = result.filter(
        (s) => s.name.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "ALL") {
      result = result.filter((s) => {
        const st = records.find((r) => r.studentId === s.id)?.status;
        if (statusFilter === "UNMARKED") return !st;
        return st === statusFilter;
      });
    }
    return result;
  }, [students, studentSearch, records, statusFilter]);

  useEffect(() => {
    if (!selectedClassId) return;
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setLoadingSessions(true);
      setActiveSession(null);
      setRecords([]);
      try {
        const [sessionList, studentList] = await Promise.all([
          getSessions(selectedClassId),
          getStudents(selectedClassId, { pageSize: 200 }),
        ]);
        if (cancelled) return;
        setSessions(sessionList || []);
        setStudents(studentList.students || []);
        setLoadingSessions(false);
      } catch {
        if (!cancelled) setLoadingSessions(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedClassId]);

  async function createSession() {
    if (!selectedClassId) return;
    try {
      const s = await createSessionApi({ classId: selectedClassId, dateKey: localDateKey() });
      toast.success("Session created");
      selectSession(s);
      fetchSessions();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function fetchSessions() {
    if (!selectedClassId) return;
    const sessionList = await getSessions(selectedClassId);
    setSessions(sessionList || []);
  }

  async function selectSession(s: AttendanceSessionDTO) {
    setActiveSession(s);
    try {
      const detail = await getSessionById(s.id);
      const existing: RecordItem[] = (detail.records || []).map((r) => ({
        studentId: r.studentId,
        status: r.status,
      }));
      setRecords(existing);
    } catch {
      setRecords(students.map(st => ({ studentId: st.id, status: "PRESENT" })));
    }
  }

  function markAll(status: "PRESENT" | "ABSENT") {
    setRecords(students.map(s => ({ studentId: s.id, status })));
  }

  function toggleStatus(studentId: string, status: "PRESENT" | "ABSENT") {
    setRecords(prev => {
      const existing = prev.find(r => r.studentId === studentId);
      if (existing) return prev.map(r => r.studentId === studentId ? { ...r, status } : r);
      return [...prev, { studentId, status }];
    });
  }

  async function saveAttendance() {
    if (!activeSession) return;
    setSaving(true);
    try {
      await saveAttendanceRecords({ sessionId: activeSession.id, records });
      toast.success("Attendance saved");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
    setSaving(false);
  }

  async function deleteSession() {
    if (!deleteId) return;
    const deleted = await deleteSessionApi(deleteId).catch(() => null);
    if (deleted) {
      toast.success("Session deleted");
      if (activeSession?.id === deleteId) { setActiveSession(null); setRecords([]); }
      fetchSessions().catch(() => undefined);
    }
    setDeleteId(null);
  }

  function getStatusFor(studentId: string): string {
    return records.find(r => r.studentId === studentId)?.status || "";
  }

  if (status === "loading" || !session?.user) {
    return <div className="flex min-h-screen items-center justify-center"><Skeleton className="h-8 w-48" /></div>;
  }

  return (
    <AppShell user={{ name: session.user.name || "", email: session.user.email || "" }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
            <p className="text-muted-foreground mt-0.5">Create sessions and track student attendance in real-time</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center">
          {loading ? <Skeleton className="h-10 w-64" /> : (
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            >
              {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.department}</option>)}
            </select>
          )}
          <Button onClick={createSession} disabled={!selectedClassId} className="sm:ml-auto">
            <Plus className="mr-2 h-4 w-4" /> New Session
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card className="card-shadow">
              <CardHeader><CardTitle className="text-lg">Sessions</CardTitle></CardHeader>
              <CardContent className="space-y-2 max-h-[500px] overflow-auto">
                {loadingSessions ? (
                  Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)
                ) : sessions.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">No sessions yet. Create one to start.</p>
                ) : (
                  sessions.map(s => (
                    <div
                      key={s.id}
                      className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors ${activeSession?.id === s.id ? "border-primary bg-primary/5" : "hover:bg-accent"}`}
                      onClick={() => selectSession(s)}
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(s.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </p>
                        <p className="text-xs text-muted-foreground">{s.recordCount} records</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(s.id); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="card-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {activeSession
                      ? new Date(activeSession.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
                      : "Select a session"}
                  </CardTitle>
                  {activeSession && (
                    <div className="flex items-center gap-2">
                      <div className="hidden items-center gap-3 text-xs text-muted-foreground sm:flex">
                        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-green-500" /> {presentCount}P</span>
                        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-red-500" /> {absentCount}A</span>
                        <span>{markedCount}/{students.length} marked</span>
                      </div>
                      <div className="h-4 w-px bg-border" />
                      <Button size="sm" variant="outline" onClick={() => markAll("PRESENT")}>
                        <CheckCircle2 className="mr-1 h-3 w-3" /> All Present
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => markAll("ABSENT")}>
                        <XCircle className="mr-1 h-3 w-3" /> All Absent
                      </Button>
                      <Button size="sm" onClick={saveAttendance} disabled={saving || markedCount === 0}>
                        {saving ? "Saving..." : "Save Attendance"}
                      </Button>
                    </div>
                  )}
                </div>
                {activeSession && students.length > 0 && (
                  <div className="mt-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${(markedCount / students.length) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {!activeSession ? (
                  <p className="py-12 text-center text-muted-foreground">Select a session or create a new one to mark attendance.</p>
                ) : students.length === 0 ? (
                  <p className="py-12 text-center text-muted-foreground">No students in this class.</p>
                ) : (
                  <>
                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <SearchBar
                        value={studentSearch}
                        onChange={setStudentSearch}
                        placeholder="Search students..."
                        delay={200}
                        className="sm:max-w-xs"
                      />
                      <div className="flex gap-1">
                        {(["ALL", "UNMARKED", "PRESENT", "ABSENT"] as const).map((f) => (
                          <Button
                            key={f}
                            size="sm"
                            variant={statusFilter === f ? "default" : "outline"}
                            className={`h-7 text-xs ${statusFilter === f ? "" : "text-muted-foreground"}`}
                            onClick={() => setStatusFilter(f)}
                          >
                            {f === "ALL" ? "All" : f === "UNMARKED" ? "Unmarked" : f === "PRESENT" ? "Present" : "Absent"}
                          </Button>
                        ))}
                      </div>
                      <span className="ml-auto text-xs text-muted-foreground sm:hidden">
                        {presentCount}P &middot; {absentCount}A &middot; {markedCount}/{students.length}
                      </span>
                    </div>
                    <div className="max-h-[400px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Roll</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredStudents.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                                {students.length === 0 ? "No students in this class." : "No students match your filter."}
                              </TableCell>
                            </TableRow>
                          ) : filteredStudents.map(s => {
                          const st = getStatusFor(s.id);
                          return (
                            <TableRow
                              key={s.id}
                              className={!st ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}
                            >
                              <TableCell><Badge variant="outline">{s.rollNumber}</Badge></TableCell>
                              <TableCell className="font-medium">{s.name}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    size="sm"
                                    variant={st === "PRESENT" ? "default" : "outline"}
                                    className={st === "PRESENT" ? "bg-green-600 hover:bg-green-700" : ""}
                                    onClick={() => toggleStatus(s.id, "PRESENT")}
                                  >
                                    <CheckCircle2 className="mr-1 h-3 w-3" /> P
                                  </Button>
                                   <Button
                                    size="sm"
                                    variant={st === "ABSENT" ? "default" : "outline"}
                                    className={st === "ABSENT" ? "bg-red-600 hover:bg-red-700" : ""}
                                    onClick={() => toggleStatus(s.id, "ABSENT")}
                                  >
                                    <XCircle className="mr-1 h-3 w-3" /> A
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete session?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this attendance session and all its records.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteSession} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

export default function AttendancePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Skeleton className="h-8 w-48" /></div>}>
      <AttendanceContent />
    </Suspense>
  );
}
