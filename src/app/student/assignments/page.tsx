"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { StudentShell } from "@/components/layout/student-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AssignmentItem {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  totalMarks: number;
  submission: {
    id: string;
    status: string;
    marks: number | null;
  } | null;
}

export default function StudentAssignments() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      fetch("/api/student/assignments")
        .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
        .then((json) => setAssignments(json.data || []))
        .catch(() => setAssignments([]))
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  if (status === "loading" || !session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  return (
    <StudentShell user={{ name: session.user.name || "", email: session.user.email || "" }}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Assignments</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assignments yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Total Marks</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{a.title}</p>
                          {a.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{a.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(a.dueDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>{a.totalMarks}</TableCell>
                      <TableCell>{a.submission?.marks ?? "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            a.submission?.status === "SUBMITTED"
                              ? "default"
                              : a.submission?.status === "LATE"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {a.submission?.status || "NOT_SUBMITTED"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </StudentShell>
  );
}
