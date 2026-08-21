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
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  AlertCircle,
  Search,
  Check,
  Loader2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ClassItem { id: string; name: string; department: string; }
interface Student { id: string; rollNumber: string; name: string; }
interface RecordItem { studentId: string; status: string; }

interface MarkAttendanceDialogProps {
  open: boolean;
  onClose: () => void;
  preselectedClassId?: string;
  onSaved?: () => void;
}

export function MarkAttendanceDialog({ open, onClose, preselectedClassId, onSaved }: MarkAttendanceDialogProps) {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(preselectedClassId || "");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
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
    if (open) {
      reset();
      fetch("/api/classes")
        .then((r) => (r.ok ? r.json() : { data: [] }))
        .then((json) => {
          const data = json.data as ClassItem[];
          setClasses(data);
          if (preselectedClassId) setSelectedClassId(preselectedClassId);
          else if (data.length > 0) setSelectedClassId(data[0].id);
        })
        .catch(() => {});
    }
  }, [open, preselectedClassId, reset]);

  useEffect(() => {
    if (!selectedClassId || !open) return;
    setLoading(true);
    setSessionId(null);
    setRecords([]);
    const today = new Date().toISOString().split("T")[0];

    Promise.all([
      fetch(`/api/attendance/sessions?classId=${selectedClassId}`).then((r) => r.ok ? r.json() : { data: [] }),
      fetch(`/api/students?classId=${selectedClassId}&pageSize=200`).then((r) => r.ok ? r.json() : { data: { students: [] } }),
    ])
      .then(([sessJson, studJson]) => {
        const sessions = (sessJson.data || []) as Array<{ id: string; date: string }>;
        const studs = ((studJson.data?.students || []) as Student[]).map((s) => ({
          id: s.id, rollNumber: s.rollNumber, name: s.name,
        }));
        setStudents(studs);
        const todaySession = sessions.find((s) => s.date.startsWith(today));
        if (todaySession) {
          setSessionId(todaySession.id);
          fetch(`/api/attendance/sessions/${todaySession.id}`)
            .then((r) => (r.ok ? r.json() : { data: { records: [] } }))
            .then((json) => {
              const existing: RecordItem[] = (json.data?.records || []).map(
                (r: { studentId: string; status: string }) => ({ studentId: r.studentId, status: r.status })
              );
              setRecords(existing);
            })
            .catch(() => setRecords(studs.map((s) => ({ studentId: s.id, status: "PRESENT" }))));
        }
      })
      .finally(() => setLoading(false));
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
    const late = records.filter((r) => r.status === "LATE").length;
    return { total, present, absent, late, unmarked: total - (present + absent + late) };
  }, [students, records]);

  function getStatus(studentId: string): string {
    return records.find((r) => r.studentId === studentId)?.status || "";
  }

  function toggleStatus(studentId: string, status: string) {
    setRecords((prev) => {
      const existing = prev.find((r) => r.studentId === studentId);
      if (existing) {
        if (existing.status === status) return prev.filter((r) => r.studentId !== studentId);
        return prev.map((r) => (r.studentId === studentId ? { ...r, status } : r));
      }
      return [...prev, { studentId, status }];
    });
  }

  function markAll(status: string) {
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
      const res = await fetch("/api/attendance/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: selectedClassId, date: new Date().toISOString() }),
      });
      if (res.ok) {
        const json = await res.json();
        setSessionId(json.data.id);
        toast.success("Session created");
      } else {
        const err = await res.json().catch(() => null);
        toast.error(err?.errors?.join(", ") || err?.message || "Failed to create session");
      }
    } catch {
      toast.error("Failed to create session");
    } finally {
      setCreating(false);
    }
  }

  async function saveAttendance() {
    if (!sessionId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/attendance/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, records }),
      });
      if (res.ok) {
        toast.success("Attendance saved successfully");
        onSaved?.();
        onClose();
      } else {
        toast.error("Failed to save attendance");
      }
    } catch {
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b">
          <DialogTitle className="text-lg font-semibold">Take Attendance</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Mark student attendance for today&apos;s session
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
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
              {Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-12" />))}
            </div>
          ) : !sessionId ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No session for today. Create one to start marking attendance.</p>
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground mb-3" />
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
                <Button size="sm" variant="outline" onClick={() => markAll("PRESENT")} className="h-9 whitespace-nowrap text-clr-green-dark">
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> All Present
                </Button>
                <Button size="sm" variant="outline" onClick={() => markAll("ABSENT")} className="h-9 whitespace-nowrap text-destructive">
                  <XCircle className="mr-1 h-3.5 w-3.5" /> All Absent
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary" className="gap-1"><Users className="h-3 w-3" /> Total: {counts.total}</Badge>
                <Badge variant="secondary" className="gap-1 bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 className="h-3 w-3" /> Present: {counts.present}
                </Badge>
                <Badge variant="secondary" className="gap-1 bg-red-50 text-red-700 border-red-200">
                  <XCircle className="h-3 w-3" /> Absent: {counts.absent}
                </Badge>
                {counts.late > 0 && (
                  <Badge variant="secondary" className="gap-1 bg-yellow-50 text-yellow-700 border-yellow-200">
                    <Clock className="h-3 w-3" /> Late: {counts.late}
                  </Badge>
                )}
                {counts.unmarked > 0 && (
                  <Badge variant="outline" className="gap-1">Unmarked: {counts.unmarked}</Badge>
                )}
              </div>

              <div className="max-h-[350px] overflow-y-auto rounded-md border divide-y">
                {filteredStudents.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No students match your search.</p>
                ) : (
                  filteredStudents.map((student) => {
                    const st = getStatus(student.id);
                    return (
                      <div
                        key={student.id}
                        className={cn(
                          "flex items-center justify-between gap-3 px-3 py-2 transition-colors",
                          st === "PRESENT" && "bg-green-50/50",
                          st === "ABSENT" && "bg-red-50/50",
                          st === "LATE" && "bg-yellow-50/50"
                        )}
                      >
                        <div className="min-w-0 flex-1 flex items-center gap-2">
                          <p className="truncate text-sm font-medium">{student.name}</p>
                          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono font-semibold text-muted-foreground">
                            {student.rollNumber}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button size="sm" variant={st === "PRESENT" ? "default" : "outline"}
                            className={cn("h-8 min-w-[72px] text-xs font-semibold", st === "PRESENT" ? "bg-green-600 hover:bg-green-700" : "text-green-700")}
                            onClick={() => toggleStatus(student.id, "PRESENT")}>
                            <Check className="mr-1 h-3 w-3" /> Present
                          </Button>
                          <Button size="sm" variant={st === "ABSENT" ? "default" : "outline"}
                            className={cn("h-8 min-w-[72px] text-xs font-semibold", st === "ABSENT" ? "bg-red-600 hover:bg-red-700" : "text-red-600")}
                            onClick={() => toggleStatus(student.id, "ABSENT")}>
                            <XCircle className="mr-1 h-3 w-3" /> Absent
                          </Button>
                          <Button size="sm" variant={st === "LATE" ? "default" : "outline"}
                            className={cn("h-8 min-w-[60px] text-xs font-semibold", st === "LATE" ? "bg-yellow-500 hover:bg-yellow-600 text-black" : "text-yellow-600")}
                            onClick={() => toggleStatus(student.id, "LATE")}>
                            <Clock className="mr-1 h-3 w-3" /> Late
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
          <div className="flex items-center justify-between border-t px-5 py-3">
            <p className="text-xs text-muted-foreground">
              {counts.present + counts.absent + counts.late} of {counts.total} marked
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
              <Button size="sm" onClick={saveAttendance} disabled={saving}>
                {saving ? <><Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> Saving...</> : <><Check className="mr-1 h-3.5 w-3.5" /> Save Attendance</>}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
