"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Upload, Download } from "lucide-react";
import { toast } from "sonner";

interface ClassItem { id: string; name: string; department: string; batch: string; }
interface Student { id: string; rollNumber: string; name: string; classId: string; }

export default function StudentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [rollNumber, setRollNumber] = useState("");
  const [name, setName] = useState("");

  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);

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
    if (selectedClassId) fetchStudents();
  }, [selectedClassId]);

  async function fetchStudents() {
    if (!selectedClassId) return;
    setLoadingStudents(true);
    const res = await fetch(`/api/students?classId=${selectedClassId}&pageSize=200`);
    if (res.ok) {
      const json = await res.json();
      setStudents(json.data.students);
    }
    setLoadingStudents(false);
  }

  function openCreate() {
    setEditStudent(null);
    setRollNumber("");
    setName("");
    setDialogOpen(true);
  }

  function openEdit(s: Student) {
    setEditStudent(s);
    setRollNumber(s.rollNumber);
    setName(s.name);
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const body = { rollNumber, name, classId: selectedClassId };
    const url = editStudent ? `/api/students/${editStudent.id}` : "/api/students";
    const method = editStudent ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      toast.success(editStudent ? "Student updated" : "Student added");
      setDialogOpen(false);
      fetchStudents();
    } else {
      const data = await res.json();
      const err = data.error;
      const msg = typeof err === "string" ? err : typeof err === "object" && err ? Object.values(err).flat().join(", ") : "Failed to save student";
      toast.error(msg);
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    const res = await fetch(`/api/students/${deleteId}`, { method: "DELETE" });
    if (res.ok) { toast.success("Student removed"); fetchStudents(); }
    else toast.error("Failed to delete student");
    setDeleteId(null);
  }

  async function handleBulkImport() {
    if (!csvText.trim() || !selectedClassId) return;
    setImporting(true);
    const lines = csvText.trim().split("\n");
    const studentsList = lines.map(line => {
      const parts = line.split(",").map(s => s.trim());
      return { rollNumber: parts[0] || "", name: parts.slice(1).join(" ") || "" };
    }).filter(s => s.rollNumber && s.name);

    const res = await fetch("/api/students/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId: selectedClassId, students: studentsList }),
    });
    if (res.ok) {
      const data = await res.json();
      toast.success(`Imported ${data.count || studentsList.length} students`);
      setCsvText("");
      fetchStudents();
    } else {
      toast.error("Failed to import students");
    }
    setImporting(false);
  }

  if (status === "loading" || !session?.user) {
    return <div className="flex min-h-screen items-center justify-center"><Skeleton className="h-8 w-48" /></div>;
  }

  return (
    <AppShell user={{ name: session.user.name || "", email: session.user.email || "" }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Students</h1>
            <p className="text-muted-foreground mt-0.5">Add, edit, and manage students across your classes</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {loading ? (
            <Skeleton className="h-10 w-64" />
          ) : (
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} — {c.department} ({c.batch})</option>
              ))}
            </select>
          )}
          <Button onClick={openCreate} disabled={!selectedClassId}><Plus className="mr-2 h-4 w-4" /> Add Student</Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="card-shadow">
              <CardHeader><CardTitle className="text-lg">Student List</CardTitle></CardHeader>
              <CardContent>
                {loadingStudents ? (
                  <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
                ) : students.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">No students in this class yet.</p>
                ) : (
                  <div className="max-h-[500px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Roll Number</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map(s => (
                          <TableRow key={s.id}>
                            <TableCell><Badge variant="outline">{s.rollNumber}</Badge></TableCell>
                            <TableCell className="font-medium">{s.name}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                              </div>
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

          <div>
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Upload className="h-4 w-4" /> CSV Import</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">Paste CSV with format: <code>rollNumber,Name</code></p>
                <Textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={"CS-24-001,Ahmed Khan\nCS-24-002,Fatima Ali"}
                  rows={6}
                  className="font-mono text-xs"
                />
                <Button onClick={handleBulkImport} disabled={importing || !csvText.trim() || !selectedClassId} className="w-full">
                  {importing ? "Importing..." : "Import Students"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editStudent ? "Edit Student" : "Add Student"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Roll Number</Label>
              <Input value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} placeholder="e.g. CS-24-001" />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ahmed Khan" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !rollNumber || !name}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove student?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this student and their attendance/submission records.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
