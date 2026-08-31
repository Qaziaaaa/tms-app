"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SearchBar } from "@/components/ui/search-bar";
import { Plus, Pencil, Trash2, Check, X, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import {
  getAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment as deleteAssignmentApi,
  saveSubmissions as saveSubmissionsApi,
  reviewSubmission as reviewSubmissionApi,
} from "@/lib/api";
import { useAuthAndClasses } from "@/hooks/use-auth-and-classes";
import { getErrorMessage } from "@/hooks/use-api-data";
import type {
  AssignmentDTO,
  SubmissionDTO,
} from "@/types/api";

export default function AssignmentsPage() {
  const { session, status, classes, selectedClassId, setSelectedClassId, loading } = useAuthAndClasses();
  const [assignments, setAssignments] = useState<AssignmentDTO[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAssignment, setEditAssignment] = useState<AssignmentDTO | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteIdRef = useRef<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [totalMarks, setTotalMarks] = useState("10");

  const [activeAssignment, setActiveAssignment] = useState<AssignmentDTO | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionDTO[]>([]);
  const [subSaving, setSubSaving] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewMarks, setReviewMarks] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  const filteredAssignments = useMemo(() => {
    if (!search.trim()) return assignments;
    const q = search.trim().toLowerCase();
    return assignments.filter((a) => a.title.toLowerCase().includes(q));
  }, [assignments, search]);
  const awaitingReviewCount = submissions.filter((submission) => submission.status === "TURNED_IN").length;

  useEffect(() => {
    if (selectedClassId) fetchAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId]);

  async function fetchAssignments() {
    if (!selectedClassId) return;
    setLoadingAssignments(true);
    setActiveAssignment(null);
    setSubmissions([]);
    try {
      setAssignments(await getAssignments(selectedClassId));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
    setLoadingAssignments(false);
  }

  function openCreate() {
    setEditAssignment(null);
    setTitle("");
    setDescription("");
    setDueDate("");
    setTotalMarks("10");
    setDialogOpen(true);
  }

  function openEdit(a: AssignmentDTO) {
    setEditAssignment(a);
    setTitle(a.title);
    setDescription(a.description || "");
    setDueDate(a.dueDate.split("T")[0]);
    setTotalMarks(String(a.totalMarks));
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const body = { classId: selectedClassId, title, description: description || undefined, dueDate, totalMarks: parseInt(totalMarks) };
    try {
      if (editAssignment) await updateAssignment(editAssignment.id, body);
      else await createAssignment(body);
      toast.success(editAssignment ? "Assignment updated" : "Assignment created");
      setDialogOpen(false);
      fetchAssignments();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
    setSaving(false);
  }

  async function handleDelete() {
    const id = deleteIdRef.current;
    if (!id) return;
    deleteIdRef.current = null;
    setDeleteId(null);
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    if (activeAssignment?.id === id) { setActiveAssignment(null); setSubmissions([]); }
    try {
      await deleteAssignmentApi(id);
      toast.success("Assignment deleted");
    } catch (err) {
      toast.error(getErrorMessage(err));
      fetchAssignments();
    }
  }

  async function selectAssignment(a: AssignmentDTO) {
    setActiveAssignment(a);
    try {
      const detail = await getAssignmentById(a.id);
      setSubmissions(detail.submissions || []);
    } catch {
      setSubmissions([]);
    }
  }

  function updateSubmission(studentId: string, field: string, value: string | number | null) {
    setSubmissions(prev => prev.map(s => {
      if (s.studentId !== studentId) return s;
      if (field === "marks" && activeAssignment) {
        const num = value === null ? null : Math.max(0, Math.min(Number(value), activeAssignment.totalMarks));
        return { ...s, marks: num };
      }
      if (field === "status" && value === "NOT_SUBMITTED") {
        return { ...s, status: value, marks: null };
      }
      return { ...s, [field]: value };
    }));
  }

  async function saveSubmissions() {
    if (!activeAssignment) return;
    setSubSaving(true);
    try {
      await saveSubmissionsApi(activeAssignment.id, {
        submissions: submissions
          .filter((s) => s.status !== "TURNED_IN")
          .map(s => ({
            studentId: s.studentId,
            status: s.status as "SUBMITTED" | "LATE" | "NOT_SUBMITTED",
            marks: s.marks,
          })),
      });
      toast.success("Submissions saved");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
    setSubSaving(false);
  }

  async function handleReview(studentId: string, action: "accept" | "reject") {
    if (!activeAssignment) return;
    const parsedMarks = reviewMarks[studentId] ? Number(reviewMarks[studentId]) : null;
    if (action === "accept" && parsedMarks != null && (!Number.isInteger(parsedMarks) || parsedMarks < 0 || parsedMarks > activeAssignment.totalMarks)) {
      toast.error(`Marks must be a whole number between 0 and ${activeAssignment.totalMarks}`);
      return;
    }
    setReviewingId(studentId);
    try {
      const marks = action === "accept" ? parsedMarks : null;
      const detail = await reviewSubmissionApi(activeAssignment.id, studentId, action, marks);
      const updatedSubmission = detail.submissions?.[0];
      if (updatedSubmission) {
        setSubmissions((current) => current.map((submission) =>
          submission.studentId === studentId ? updatedSubmission : submission
        ));
      }
      setReviewMarks((prev) => ({ ...prev, [studentId]: "" }));
      toast.success(action === "accept" ? "Submission accepted" : "Submission returned to student");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
    setReviewingId(null);
  }

  if (status === "loading" || !session?.user) {
    return <div className="flex min-h-screen items-center justify-center"><Skeleton className="h-8 w-48" /></div>;
  }

  return (
    <AppShell user={{ name: session.user.name || "", email: session.user.email || "" }}>
      <div className="page-stack">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Assignments</h1>
            <p className="page-description">Create work, review submissions, and keep grading moving.</p>
          </div>
        </div>

        <div className="surface flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
          {loading ? <Skeleton className="h-10 w-64" /> : (
            <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm sm:w-auto sm:max-w-[200px]">
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search assignments..."
            delay={200}
            className="w-full sm:max-w-xs"
          />
          <Button onClick={openCreate} disabled={!selectedClassId} className="w-full sm:w-auto sm:ml-auto"><Plus className="mr-2 h-4 w-4" /> New Assignment</Button>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card className="card-shadow h-full">
              <CardHeader className="border-b bg-muted/60 py-3">
                <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                  Assignments
                  {!loadingAssignments && (
                    <span className="text-xs sm:text-sm font-normal text-muted-foreground">
                      {search.trim() ? `${filteredAssignments.length} of ${assignments.length}` : assignments.length}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-[350px] sm:max-h-[560px] space-y-2 overflow-auto py-3">
                {loadingAssignments ? (
                  Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)
                ) : filteredAssignments.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    {assignments.length === 0 ? "No assignments yet." : "No assignments match your search."}
                  </p>
                ) : (
                  filteredAssignments.map(a => (
                    <div key={a.id} className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${activeAssignment?.id === a.id ? "border-primary bg-primary/5 shadow-sm" : "hover:bg-muted"}`} onClick={() => selectAssignment(a)}>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{a.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">Due {new Date(a.dueDate).toLocaleDateString()} · {a.totalMarks} marks · {a.submissionCount} submissions</p>
                        {a.awaitingReviewCount ? <Badge variant="secondary" className="mt-2 text-[10px]">{a.awaitingReviewCount} awaiting review</Badge> : null}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(a); }}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); deleteIdRef.current = a.id; setDeleteId(a.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="card-shadow">
              <CardHeader className="border-b bg-muted/60 py-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <CardTitle className="text-base sm:text-lg truncate">{activeAssignment ? activeAssignment.title : "Select an assignment"}</CardTitle>
                  {activeAssignment && (
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {awaitingReviewCount > 0 && (
                        <span className="rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                          {awaitingReviewCount} awaiting review
                        </span>
                      )}
                      <Button size="sm" onClick={saveSubmissions} disabled={subSaving} className="text-xs">{subSaving ? "Saving..." : "Save Submissions"}</Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!activeAssignment ? (
                  <p className="py-12 text-center text-muted-foreground">Select an assignment to manage submissions.</p>
                ) : submissions.length === 0 ? (
                  <p className="py-12 text-center text-muted-foreground">No students in this class.</p>
                ) : (
                  <div className="max-h-[400px] overflow-x-auto overflow-y-auto">
                    <Table className="min-w-[500px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Roll</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-24">Marks</TableHead>
                          <TableHead className="w-28">Review</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submissions.map(s => {
                          const isTurnedIn = s.status === "TURNED_IN";
                          const marksValue = reviewMarks[s.studentId] ?? "";
                          return (
                            <TableRow key={s.studentId}>
                              <TableCell><Badge variant="outline">{s.student.rollNumber}</Badge></TableCell>
                              <TableCell className="font-medium">{s.student.name}</TableCell>
                              <TableCell>
                                {isTurnedIn ? (
                                  <div className="space-y-1">
                                    <Badge variant="secondary">Awaiting Review</Badge>
                                    {s.submissionLink && (
                                      <a href={s.submissionLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                                        <LinkIcon size={12} /> View work
                                      </a>
                                    )}
                                    {s.submissionNote && (
                                      <p className="max-w-[220px] truncate text-xs text-muted-foreground" title={s.submissionNote}>
                                        {s.submissionNote}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <select
                                    value={s.status}
                                    onChange={(e) => updateSubmission(s.studentId, "status", e.target.value)}
                                    className={`h-7 cursor-pointer rounded-full border px-2 text-xs font-semibold outline-none transition-colors ${
                                      s.status === "SUBMITTED"
                                        ? "border-emerald-300 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                        : s.status === "LATE"
                                          ? "border-amber-300 bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                          : "border-border bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    <option value="NOT_SUBMITTED">Not Submitted</option>
                                    <option value="SUBMITTED">Submitted</option>
                                    <option value="LATE">Late</option>
                                  </select>
                                )}
                              </TableCell>
                              <TableCell>
                                {isTurnedIn ? (
                                  <Input
                                    type="number"
                                    value={marksValue}
                                    onChange={(e) => setReviewMarks((p) => ({ ...p, [s.studentId]: e.target.value }))}
                                    placeholder={`/${activeAssignment.totalMarks}`}
                                    className="h-8 text-xs"
                                    min={0}
                                    max={activeAssignment.totalMarks}
                                    disabled={reviewingId === s.studentId}
                                  />
                                ) : (
                                  <Input
                                    type="number"
                                    value={s.marks ?? ""}
                                    onChange={(e) => updateSubmission(s.studentId, "marks", e.target.value ? parseInt(e.target.value) : null)}
                                    placeholder={`/${activeAssignment.totalMarks}`}
                                    className={`h-8 text-xs ${s.status === "NOT_SUBMITTED" ? "opacity-40" : ""}`}
                                    min={0}
                                    max={activeAssignment.totalMarks}
                                    disabled={s.status === "NOT_SUBMITTED"}
                                    title={s.status === "NOT_SUBMITTED" ? "Marks are only available for Submitted or Late submissions" : undefined}
                                  />
                                )}
                              </TableCell>
                              <TableCell>
                                {isTurnedIn ? (
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 gap-1 text-xs text-emerald-600"
                                      disabled={reviewingId === s.studentId}
                                      onClick={() => handleReview(s.studentId, "accept")}
                                    >
                                      <Check className="h-3.5 w-3.5" /> Accept
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 gap-1 text-xs text-destructive"
                                      disabled={reviewingId === s.studentId}
                                      onClick={() => handleReview(s.studentId, "reject")}
                                    >
                                      <X className="h-3.5 w-3.5" /> Reject
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editAssignment ? "Edit Assignment" : "New Assignment"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Assignment 1" />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Assignment details..." rows={3} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Total Marks</Label>
                <Input type="number" value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} min={1} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !title || !dueDate}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) { deleteIdRef.current = null; setDeleteId(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete assignment?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the assignment and all submission records.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
