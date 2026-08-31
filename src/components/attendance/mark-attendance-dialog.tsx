"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Check,
  Loader2,
  Plus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn, localDateKey } from "@/lib/utils";
import {
  getClasses,
  getStudents,
  getSessions,
  getSessionById,
  createSession as createSessionApi,
  saveAttendanceRecords,
} from "@/lib/api";
import { getErrorMessage } from "@/hooks/use-api-data";
import type { ClassDTO, StudentDTO } from "@/types/api";

interface RecordItem { studentId: string; status: "PRESENT" | "ABSENT" }

interface MarkAttendanceDialogProps {
  open: boolean;
  onClose: () => void;
  preselectedClassId?: string;
  onSaved?: () => void;
}

export function MarkAttendanceDialog({ open, onClose, preselectedClassId, onSaved }: MarkAttendanceDialogProps) {
  const [classes, setClasses] = useState<ClassDTO[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(preselectedClassId || "");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentDTO[]>([]);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);

  const reset = useCallback(() => {
    setSelectedClassId(preselectedClassId || "");
    setSessionId(null);
    setStudents([]);
    setRecords([]);
    setSearch("");
  }, [preselectedClassId]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      reset();
      try {
        const data = await getClasses();
        if (cancelled) return;
        setClasses(data);
        if (preselectedClassId) setSelectedClassId(preselectedClassId);
        else if (data.length > 0) setSelectedClassId(data[0].id);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [open, preselectedClassId, reset]);

  useEffect(() => {
    if (!selectedClassId || !open) return;
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setLoading(true);
      setSessionId(null);
      setRecords([]);
      const today = localDateKey();

      try {
        const [sessions, studentList] = await Promise.all([
          getSessions(selectedClassId),
          getStudents(selectedClassId, { pageSize: 200 }),
        ]);
        if (cancelled) return;
        const studs: StudentDTO[] = (studentList.students || []).map((s) => ({
          id: s.id, rollNumber: s.rollNumber, name: s.name,
        }));
        setStudents(studs);
        const todaySession = (sessions || []).find((s) => s.dateKey === today);
        if (todaySession) {
          setSessionId(todaySession.id);
          try {
            const detail = await getSessionById(todaySession.id);
            if (cancelled) return;
            const existing: RecordItem[] = (detail.records || []).map(
              (r) => ({ studentId: r.studentId, status: r.status })
            );
            setRecords(existing);
          } catch {}
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedClassId, open]);

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.trim().toLowerCase();
    return students.filter((s) => s.name.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q));
  }, [students, search]);

  const counts = useMemo(() => {
    const total = students.length;
    const present = records.filter((r) => r.status === "PRESENT").length;
    const absent = records.filter((r) => r.status === "ABSENT").length;
    const notMarked = total - (present + absent);
    return { total, present, absent, notMarked };
  }, [students, records]);

  function getStatus(studentId: string): string {
    return records.find((r) => r.studentId === studentId)?.status || "";
  }

  function toggleStatus(studentId: string, status: "PRESENT" | "ABSENT") {
    setRecords((prev) => {
      const existing = prev.find((r) => r.studentId === studentId);
      if (existing) {
        if (existing.status === status) return prev.filter((r) => r.studentId !== studentId);
        return prev.map((r) => (r.studentId === studentId ? { ...r, status } : r));
      }
      return [...prev, { studentId, status }];
    });
  }

  function markAll(status: "PRESENT" | "ABSENT") {
    const filteredIds = new Set(filteredStudents.map((s) => s.id));
    setRecords((prev) => {
      const others = prev.filter((r) => !filteredIds.has(r.studentId));
      return [...others, ...filteredStudents.map((s) => ({ studentId: s.id, status }))];
    });
  }

  async function createSession() {
    if (!selectedClassId) return;
    setCreating(true);
    try {
      const session = await createSessionApi({ classId: selectedClassId, dateKey: localDateKey() });
      setSessionId(session.id);
      toast.success("Session created");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  async function saveAttendance() {
    if (!sessionId) return;
    setSaving(true);
    try {
      await saveAttendanceRecords({ sessionId, records });
      toast.success("Attendance saved successfully");
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">Mark Attendance</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Update daily student attendance records
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name} - {c.department}</option>
              ))}
            </select>
            {!sessionId && !loading && (
              <Button size="sm" variant="outline" onClick={createSession} disabled={creating || !selectedClassId} className="h-9">
                {creating ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-2 h-3.5 w-3.5" />}
                Create Session
              </Button>
            )}
          </div>

          {loading ? (
            <div className="space-y-2 py-4">
              {Array.from({ length: 6 }).map((_, i) => (<Skeleton key={i} className="h-14" />))}
            </div>
          ) : !sessionId ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No session for today. Create one to start marking attendance.</p>
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No students in this class.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    placeholder="Search by name or roll..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm"
                  />
                </div>
                <Button size="sm" variant="outline" onClick={() => markAll("PRESENT")} className="h-9 whitespace-nowrap text-green-700 border-green-200 hover:bg-green-50">
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> All Present
                </Button>
                <Button size="sm" variant="outline" onClick={() => markAll("ABSENT")} className="h-9 whitespace-nowrap text-red-600 border-red-200 hover:bg-red-50">
                  <XCircle className="mr-1.5 h-3.5 w-3.5" /> All Absent
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Users className="h-3 w-3" /> Total: {counts.total}
                </Badge>
                <Badge variant="secondary" className="gap-1 text-xs bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 className="h-3 w-3" /> Present: {counts.present}
                </Badge>
                <Badge variant="secondary" className="gap-1 text-xs bg-red-50 text-red-700 border-red-200">
                  <XCircle className="h-3 w-3" /> Absent: {counts.absent}
                </Badge>
                {counts.notMarked > 0 && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <AlertCircle className="h-3 w-3" /> Not Marked: {counts.notMarked}
                  </Badge>
                )}
              </div>

              <div className="max-h-[420px] min-h-[280px] overflow-y-auto rounded-lg border divide-y">
                {filteredStudents.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">No students match your search.</p>
                ) : (
                  filteredStudents.map((student) => {
                    const st = getStatus(student.id);
                    const isPresent = st === "PRESENT";
                    const isAbsent = st === "ABSENT";
                    const isUnmarked = !st;

                    return (
                      <div
                        key={student.id}
                        className={cn(
                          "flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 transition-colors duration-150",
                          isPresent && "bg-green-50/50 hover:bg-green-50",
                          isAbsent && "bg-red-50/50 hover:bg-red-50",
                          isUnmarked && "hover:bg-muted/50"
                        )}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                            {student.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-semibold">{student.name}</p>
                              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono font-semibold text-muted-foreground">
                                {student.rollNumber}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          {isUnmarked && (
                            <Badge variant="outline" className="text-[10px] mr-1 border-dashed text-muted-foreground">
                              Not Marked
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            variant={isPresent ? "default" : "outline"}
                            className={cn(
                              "h-8 min-w-[80px] text-xs font-semibold",
                              isPresent ? "bg-green-600 hover:bg-green-700 text-white" : "text-green-700 border-green-200 hover:bg-green-50"
                            )}
                            onClick={() => toggleStatus(student.id, "PRESENT")}
                          >
                            <Check className="mr-1 h-3 w-3" /> Present
                          </Button>
                          <Button
                            size="sm"
                            variant={isAbsent ? "default" : "outline"}
                            className={cn(
                              "h-8 min-w-[80px] text-xs font-semibold",
                              isAbsent ? "bg-red-600 hover:bg-red-700 text-white" : "text-red-600 border-red-200 hover:bg-red-50"
                            )}
                            onClick={() => toggleStatus(student.id, "ABSENT")}
                          >
                            <XCircle className="mr-1 h-3 w-3" /> Absent
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {sessionId && students.length > 0 && (
          <DialogFooter className="px-6 py-3.5 border-t border-border bg-muted/40 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{counts.present + counts.absent}</span> of {counts.total} marked
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onClose} className="h-9 px-4">
                Cancel
              </Button>
              <Button size="sm" onClick={saveAttendance} disabled={saving} className="h-9 px-4 gap-1.5">
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" /> Save Attendance
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
