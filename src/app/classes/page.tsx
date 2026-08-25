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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SearchBar } from "@/components/ui/search-bar";
import { Plus, Pencil, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { getClasses, createClass, updateClass, deleteClass } from "@/lib/api";
import { getErrorMessage } from "@/hooks/use-api-data";
import type { ClassDTO } from "@/types/api";

export default function ClassesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState<ClassDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteIdRef = useRef<string | null>(null);
  const [editClass, setEditClass] = useState<ClassDTO | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [batch, setBatch] = useState("");
  const [schedule, setSchedule] = useState("");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  const departments = useMemo(() => {
    const set = new Set(classes.map((c) => c.department));
    return Array.from(set).sort();
  }, [classes]);

  const filteredClasses = useMemo(() => {
    let result = classes;
    if (deptFilter) result = result.filter((c) => c.department === deptFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.department.toLowerCase().includes(q) || c.batch.toLowerCase().includes(q)
      );
    }
    return result;
  }, [classes, search, deptFilter]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") fetchClasses();
  }, [status, router]);

  async function fetchClasses() {
    try {
      setClasses(await getClasses());
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
    setLoading(false);
  }

  function openCreate() {
    setEditClass(null);
    setName("");
    setDepartment("");
    setBatch("");
    setSchedule("");
    setDialogOpen(true);
  }

  function openEdit(cls: ClassDTO) {
    setEditClass(cls);
    setName(cls.name);
    setDepartment(cls.department);
    setBatch(cls.batch);
    setSchedule(cls.schedule || "");
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const body = { name, department, batch, schedule: schedule || undefined };
    try {
      if (editClass) await updateClass(editClass.id, body);
      else await createClass(body);
      toast.success(editClass ? "Class updated" : "Class created");
      setDialogOpen(false);
      fetchClasses();
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
    try {
      await deleteClass(id);
      toast.success("Class deleted");
      fetchClasses();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  if (status === "loading" || !session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  return (
    <AppShell user={{ name: session.user.name || "", email: session.user.email || "" }}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Classes</h1>
            <p className="text-muted-foreground mt-0.5">Manage your classes, schedules, and student groups</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search classes..."
            delay={200}
          />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {!loading && (
            <span className="text-sm text-muted-foreground sm:ml-auto">
              {filteredClasses.length} class{filteredClasses.length !== 1 ? "es" : ""}
            </span>
          )}
          <Button onClick={openCreate} className="shadow-md sm:ml-auto">
            <Plus className="mr-2 h-4 w-4" /> Add Class
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
          </div>
          ) : filteredClasses.length === 0 ? (
          <Card className="card-shadow">
            <CardContent className="py-16 text-center text-muted-foreground">
              {classes.length === 0 ? 'No classes yet. Click "Add Class" to create your first one.' : "No classes match your search."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClasses.map((cls) => (
              <Card key={cls.id} className="card-shadow card-hover group cursor-pointer" onClick={() => router.push(`/classes/${cls.id}`)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg hover:underline">{cls.name}</CardTitle>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(cls); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); deleteIdRef.current = cls.id; setDeleteId(cls.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Badge variant="secondary">{cls.department}</Badge>
                  <Badge variant="outline">Batch {cls.batch}</Badge>
                  {cls.schedule && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" /> {cls.schedule}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{cls.studentCount ?? 0} students</span>
                    <span>&middot;</span>
                    <span>{cls.sessionCount ?? 0} sessions</span>
                  </div>
                  {(cls.sessionCount ?? 0) > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${(cls.averageAttendance ?? 0) >= 75 ? "bg-green-500" : (cls.averageAttendance ?? 0) >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                          style={{ width: `${Math.min(cls.averageAttendance ?? 0, 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-muted-foreground">{cls.averageAttendance ?? 0}%</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editClass ? "Edit Class" : "New Class"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Class Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Artificial Intelligence" />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Computer Science" />
            </div>
            <div className="space-y-2">
              <Label>Batch</Label>
              <Input value={batch} onChange={(e) => setBatch(e.target.value)} placeholder="e.g. 2025" />
            </div>
            <div className="space-y-2">
              <Label>Schedule (optional)</Label>
              <Input value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="e.g. Monday 10:00 AM" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !name || !department || !batch}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) { deleteIdRef.current = null; setDeleteId(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete class?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the class and all its students, attendance records, and assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
