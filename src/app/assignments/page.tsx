"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ClassItem { id: string; name: string; }
interface Assignment { id: string; title: string; description: string | null; dueDate: string; totalMarks: number; submissionCount: number; }
interface Submission { id: string; studentId: string; status: string; marks: number | null; student: { id: string; name: string; rollNumber: string }; }

export default function AssignmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAssignment, setEditAssignment] = useState<Assignment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteIdRef = useRef<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [totalMarks, setTotalMarks] = useState("10");

  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [subSaving, setSubSaving] = useState(false);
  const [search, setSearch] = useState("");

  const filteredAssignments = useMemo(() => {
    if (!search.trim()) return assignments;
    const q = search.trim().toLowerCase();
    return assignments.filter((a) => a.title.toLowerCase().includes(q));
  }, [assignments, search]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      fetch("/api/classes")
        .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
        .then((json) => {
          const data = json.data as ClassItem[];
          setClasses(data);
          if (data.length > 0) setSelectedClassId(data[0].id);
        })
        .catch(() => setClasses([]))
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  useEffect(() => {
    if (selectedClassId) fetchAssignments();
  }, [selectedClassId]);

  async function fetchAssignments() {
    if (!selectedClassId) return;
    setLoadingAssignments(true);
    setActiveAssignment(null);
    setSubmissions([]);
    const res = await fetch(`/api/assignments?classId=${selectedClassId}`);
    if (res.ok) {
      const json = await res.json();
      setAssignments(json.data);
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

  function openEdit(a: Assignment) {
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
    const url = editAssignment ? `/api/assignments/${editAssignment.id}` : "/api/assignments";
    const method = editAssignment ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { toast.success(editAssignment ? "Assignment updated" : "Assignment created"); setDialogOpen(false); fetchAssignments(); }
    else toast.error("Failed to save assignment");
    setSaving(false);
  }

  async function handleDelete() {
    const id = deleteIdRef.current;
    if (!id) return;
    deleteIdRef.current = null;
    setDeleteId(null);
    const res = await fetch(`/api/assignments/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Assignment deleted"); if (activeAssignment?.id === id) { setActiveAssignment(null); setSubmissions([]); } fetchAssignments(); }
  }

  async function selectAssignment(a: Assignment) {
    setActiveAssignment(a);
    const res = await fetch(`/api/assignments/${a.id}`);
    if (res.ok) {
      const json = await res.json();
      setSubmissions(json.data.submissions || []);
    }
  }

  function updateSubmission(studentId: string, field: string, value: string | number | null) {
    setSubmissions(prev => prev.map(s => s.studentId === studentId ? { ...s, [field]: value } : s));
  }

  async function saveSubmissions() {
    if (!activeAssignment) return;
    setSubSaving(true);
    const res = await fetch(`/api/assignments/${activeAssignment.id}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submissions: submissions.map(s => ({
          studentId: s.studentId,
          status: s.status,
          marks: s.marks,
        })),
      }),
    });
    if (res.ok) toast.success("Submissions saved");
    else toast.error("Failed to save submissions");
    setSubSaving(false);
  }

  if (status === "loading" || !session?.user) {
    return <div className="flex min-h-screen items-center justify-center"><Skeleton className="h-8 w-48" /></div>;
  }

  return (
    <AppShell user={{ name: session.user.name || "", email: session.user.email || "" }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Assignments</h1>
            <p className="text-muted-foreground mt-0.5">Create assignments and manage student submissions</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center">
          {loading ? <Skeleton className="h-10 w-64" /> : (
            <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm">
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search assignments..."
            delay={200}
          />
          <Button onClick={openCreate} disabled={!selectedClassId} className="sm:ml-auto"><Plus className="mr-2 h-4 w-4" /> New Assignment</Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Assignments
                  {!loadingAssignments && (
                    <span className="text-sm font-normal text-muted-foreground">
                      {search.trim() ? `${filteredAssignments.length} of ${assignments.length}` : assignments.length}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[500px] overflow-auto">
                {loadingAssignments ? (
                  Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)
                ) : filteredAssignments.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    {assignments.length === 0 ? "No assignments yet." : "No assignments match your search."}
                  </p>
                ) : (
                  filteredAssignments.map(a => (
                    <div key={a.id} className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors ${activeAssignment?.id === a.id ? "border-primary bg-primary/5" : "hover:bg-accent"}`} onClick={() => selectAssignment(a)}>
                      <div>
                        <p className="text-sm font-medium">{a.title}</p>
                        <p className="text-xs text-muted-foreground">Due {new Date(a.dueDate).toLocaleDateString()} &middot; {a.totalMarks} marks &middot; {a.submissionCount} submissions</p>
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
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{activeAssignment ? activeAssignment.title : "Select an assignment"}</CardTitle>
                  {activeAssignment && <Button onClick={saveSubmissions} disabled={subSaving}>{subSaving ? "Saving..." : "Save Submissions"}</Button>}
                </div>
              </CardHeader>
              <CardContent>
                {!activeAssignment ? (
                  <p className="py-12 text-center text-muted-foreground">Select an assignment to manage submissions.</p>
                ) : submissions.length === 0 ? (
                  <p className="py-12 text-center text-muted-foreground">No students in this class.</p>
                ) : (
                  <div className="max-h-[400px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Roll</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-24">Marks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submissions.map(s => (
                          <TableRow key={s.studentId}>
                            <TableCell><Badge variant="outline">{s.student.rollNumber}</Badge></TableCell>
                            <TableCell className="font-medium">{s.student.name}</TableCell>
                            <TableCell>
                              <select
                                value={s.status}
                                onChange={(e) => updateSubmission(s.studentId, "status", e.target.value)}
                                className="rounded border border-input bg-background px-2 py-1 text-xs"
                              >
                                <option value="NOT_SUBMITTED">Not Submitted</option>
                                <option value="SUBMITTED">Submitted</option>
                                <option value="LATE">Late</option>
                              </select>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={s.marks ?? ""}
                                onChange={(e) => updateSubmission(s.studentId, "marks", e.target.value ? parseInt(e.target.value) : null)}
                                placeholder={`/${activeAssignment.totalMarks}`}
                                className="h-8 text-xs"
                                min={0}
                                max={activeAssignment.totalMarks}
                              />
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
            <div className="grid grid-cols-2 gap-4">
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
