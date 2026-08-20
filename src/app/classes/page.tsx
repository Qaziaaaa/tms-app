"use client";

import { useEffect, useRef, useState } from "react";
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
import { Plus, Pencil, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";

interface Class {
  id: string;
  name: string;
  department: string;
  batch: string;
  schedule: string | null;
  _count: { students: number };
}

export default function ClassesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteIdRef = useRef<string | null>(null);
  const [editClass, setEditClass] = useState<Class | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [batch, setBatch] = useState("");
  const [schedule, setSchedule] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") fetchClasses();
  }, [status, router]);

  async function fetchClasses() {
    const res = await fetch("/api/classes");
    if (res.ok) {
      const json = await res.json();
      setClasses(json.data);
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

  function openEdit(cls: Class) {
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
    const url = editClass ? `/api/classes/${editClass.id}` : "/api/classes";
    const method = editClass ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      toast.success(editClass ? "Class updated" : "Class created");
      setDialogOpen(false);
      fetchClasses();
    } else {
      toast.error("Failed to save class");
    }
    setSaving(false);
  }

  async function handleDelete() {
    const id = deleteIdRef.current;
    if (!id) return;
    deleteIdRef.current = null;
    setDeleteId(null);
    const res = await fetch(`/api/classes/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Class deleted");
      fetchClasses();
    } else {
      toast.error("Failed to delete class");
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Classes</h1>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Class
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
          </div>
        ) : classes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No classes yet. Click "Add Class" to create your first one.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((cls) => (
              <Card key={cls.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{cls.name}</CardTitle>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cls)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { deleteIdRef.current = cls.id; setDeleteId(cls.id); }}>
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
                  <p className="text-sm text-muted-foreground">{cls._count.students} students</p>
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
