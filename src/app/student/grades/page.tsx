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

interface GradeItem {
  assignmentId: string;
  title: string;
  dueDate: string;
  totalMarks: number;
  marks: number;
  status: string;
  percentage: number;
}

interface GradesData {
  grades: GradeItem[];
  summary: {
    totalMarksObtained: number;
    totalPossibleMarks: number;
    overallPercentage: number;
  };
}

export default function StudentGrades() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<GradesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      fetch("/api/student/grades")
        .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
        .then((json) => setData(json.data))
        .catch(() => setData(null))
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
        <h1 className="text-2xl font-bold">My Grades</h1>

        {!loading && data?.summary && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{data.summary.totalMarksObtained}</p>
                <p className="text-sm text-muted-foreground">Marks Obtained</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{data.summary.totalPossibleMarks}</p>
                <p className="text-sm text-muted-foreground">Total Marks</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{data.summary.overallPercentage}%</p>
                <p className="text-sm text-muted-foreground">Overall Average</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Grade Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : data?.grades.length === 0 ? (
              <p className="text-sm text-muted-foreground">No grades available yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.grades.map((g) => (
                    <TableRow key={g.assignmentId}>
                      <TableCell className="font-medium">{g.title}</TableCell>
                      <TableCell>{g.marks}/{g.totalMarks}</TableCell>
                      <TableCell>{g.percentage}%</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            g.percentage >= 70
                              ? "default"
                              : g.percentage >= 50
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {g.percentage >= 70 ? "Good" : g.percentage >= 50 ? "Average" : "Below Average"}
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
