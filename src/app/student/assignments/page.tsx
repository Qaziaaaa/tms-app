"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { StudentShell } from "@/components/layout/student-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { getStudentAssignments } from "@/lib/api";
import type { PortalAssignmentsDTO } from "@/types/api";

function getDaysUntil(dueDate: string) {
  const now = new Date();
  const due = new Date(dueDate);
  const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function getDueLabel(dueDate: string, submitted: boolean) {
  if (submitted) return null;
  const days = getDaysUntil(dueDate);
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, variant: "destructive" as const };
  if (days === 0) return { text: "Due today", variant: "destructive" as const };
  if (days <= 2) return { text: `${days}d left`, variant: "secondary" as const };
  return { text: `${days}d left`, variant: "outline" as const };
}

export default function StudentAssignments() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<PortalAssignmentsDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      getStudentAssignments()
        .then(setData)
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
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Assignments</h1>
          <p className="text-sm text-muted-foreground mt-0.5">View and track your assignment progress</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
            : data?.summary && (
                <>
                  <Card className="card-shadow">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="rounded-xl bg-blue-500/10 p-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold">{data.summary.total}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="card-shadow">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="rounded-xl bg-emerald-500/10 p-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Submitted</p>
                        <p className="text-2xl font-bold">{data.summary.submitted}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="card-shadow">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="rounded-xl bg-amber-500/10 p-3">
                        <Clock className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending</p>
                        <p className="text-2xl font-bold">{data.summary.pending}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="card-shadow">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="rounded-xl bg-red-500/10 p-3">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overdue</p>
                        <p className="text-2xl font-bold">{data.summary.overdue}</p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
        </div>

        <Card className="card-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">All Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : data?.assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No assignments yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {data?.assignments.map((a) => {
                  const submitted = !!a.submission;
                  const dueLabel = getDueLabel(a.dueDate, submitted);
                  return (
                    <div
                      key={a.id}
                      className={`rounded-xl border p-4 transition-all hover:shadow-md ${
                        a.isOverdue && !submitted
                          ? "border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20"
                          : "border-border/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-sm leading-tight">{a.title}</h3>
                        <Badge
                          variant={submitted ? "default" : a.isOverdue ? "destructive" : "secondary"}
                          className="shrink-0 text-xs"
                        >
                          {submitted ? "Submitted" : "Pending"}
                        </Badge>
                      </div>
                      {a.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{a.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {new Date(a.dueDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {submitted && a.submission?.marks != null && (
                            <span className="font-semibold text-foreground">
                              {a.submission.marks}/{a.totalMarks}
                            </span>
                          )}
                          {!submitted && dueLabel && (
                            <Badge variant={dueLabel.variant} className="text-[10px] px-1.5 py-0">
                              {dueLabel.text}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StudentShell>
  );
}
