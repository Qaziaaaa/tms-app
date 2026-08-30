"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StudentShell } from "@/components/layout/student-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Send,
  Undo2,
  Loader2,
  Link as LinkIcon,
} from "lucide-react";
import {
  getStudentAssignments,
  turnInAssignment,
  unsubmitAssignment,
} from "@/lib/api";
import { ApiClientError } from "@/lib/api-client";
import type { PortalAssignmentsDTO } from "@/types/api";

function getDaysUntil(dueDate: string) {
  const now = new Date();
  const due = new Date(dueDate);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getStatusBadge(submission: PortalAssignmentsDTO["assignments"][number]["submission"]) {
  if (!submission) return null;
  if (submission.status === "TURNED_IN") {
    return (
      <Badge variant="secondary" className="text-xs">
        Awaiting Review
      </Badge>
    );
  }
  if (submission.status === "LATE") {
    return (
      <Badge variant="outline" className="text-xs">
        Submitted (Late)
      </Badge>
    );
  }
  return (
    <Badge variant="default" className="text-xs">
      Submitted
    </Badge>
  );
}

export default function StudentAssignments() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<PortalAssignmentsDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const [turnInId, setTurnInId] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [unsubmittingId, setUnsubmittingId] = useState<string | null>(null);

  const load = () => {
    getStudentAssignments()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") load();
  }, [status, router]);

  const handleTurnIn = async (assignmentId: string) => {
    if (!link.trim() && !note.trim()) {
      toast.error("Add a URL link or a note before turning in.");
      return;
    }
    setSubmitting(true);
    try {
      await turnInAssignment(assignmentId, {
        submissionLink: link.trim() || undefined,
        submissionNote: note.trim() || undefined,
      });
      toast.success("Assignment turned in for review");
      setTurnInId(null);
      setLink("");
      setNote("");
      load();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Failed to turn in assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnsubmit = async (assignmentId: string) => {
    setUnsubmittingId(assignmentId);
    try {
      await unsubmitAssignment(assignmentId);
      toast.success("Submission withdrawn");
      load();
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : "Failed to withdraw submission"
      );
    } finally {
      setUnsubmittingId(null);
    }
  };

  if (status === "loading" || !session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  const summary = data?.summary;
  const assignments = data?.assignments ?? [];
  const prioritizedAssignments = [...assignments].sort((a, b) => {
    const priority = (assignment: (typeof assignments)[number]) => {
      if (assignment.submission?.status === "TURNED_IN") return 0;
      if (!assignment.submission && assignment.isOverdue) return 1;
      if (!assignment.submission) return 2;
      return 3;
    };
    return priority(a) - priority(b) || new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
  const nextAction = prioritizedAssignments.find((assignment) => !assignment.submission) ?? null;

  return (
    <StudentShell user={{ name: session.user.name || "", email: session.user.email || "" }}>
      <div className="page-stack">
        <div>
          <h2 className="page-title">My Assignments</h2>
          <p className="page-description">Your work is ordered by what needs attention first.</p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          ) : (
            <>
              <StatCard label="Total" value={summary?.total ?? 0} icon={FileText} />
              <StatCard label="Submitted" value={summary?.submitted ?? 0} icon={CheckCircle2} iconBg="bg-clr-green-bg" iconColor="text-clr-green" />
              <StatCard label="Awaiting Review" value={summary?.awaiting ?? 0} icon={Clock} iconBg="bg-clr-amber-bg" iconColor="text-clr-amber" />
              <StatCard label="Pending / Overdue" value={(summary?.pending ?? 0) + (summary?.overdue ?? 0)} icon={AlertTriangle} iconBg="bg-clr-red-bg" iconColor="text-clr-red" />
            </>
          )}
        </div>

        {!loading && (
          <div className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next action</p>
              {nextAction ? (
                <>
                  <p className="mt-1 truncate text-sm font-semibold text-card-foreground">{nextAction.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {nextAction.isOverdue ? "Overdue — turn it in as soon as possible." : `Due ${new Date(nextAction.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${nextAction.totalMarks} marks`}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm font-medium text-card-foreground">You’re all caught up.</p>
              )}
            </div>
            {nextAction && (
              <Button size="sm" onClick={() => { setTurnInId(nextAction.id); setLink(""); setNote(""); }}>
                <Send className="mr-1.5 h-4 w-4" /> Turn in now
              </Button>
            )}
          </div>
        )}

        <div className="surface">
          <div className="surface-header">
            <h3 className="text-base font-semibold text-card-foreground">All Assignments</h3>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Priority items appear first; completed work stays below.</p>
          </div>

          {loading ? (
            <div className="space-y-1 p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : assignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <Send className="mb-2 h-8 w-8" />
              <p className="text-sm">No assignments yet.</p>
            </div>
          ) : (
            <div>
              {prioritizedAssignments.map((a, index) => {
                const submitted = !!a.submission;
                const awaiting = a.submission?.status === "TURNED_IN";
                const notSubmitted = !submitted;
                const days = getDaysUntil(a.dueDate);
                const isOpen = turnInId === a.id;
                return (
                  <div
                    key={a.id}
                    className={`interactive-row p-3 sm:p-4 ${index < prioritizedAssignments.length - 1 ? "border-b border-border" : ""}`}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[13px] font-medium text-card-foreground">{a.title}</span>
                          {getStatusBadge(a.submission)}
                          {notSubmitted && a.isOverdue && (
                            <Badge variant="destructive" className="text-xs">
                              Overdue
                            </Badge>
                          )}
                        </div>
                        {a.description && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{a.description}</p>
                        )}
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(a.dueDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          {submitted && a.submission?.marks != null && (
                            <span className="font-semibold text-card-foreground">
                              {a.submission.marks}/{a.totalMarks} marks
                            </span>
                          )}
                          {awaiting && <span className="text-xs">Grading pending</span>}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
                        {notSubmitted && !a.isOverdue && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {days === 0 ? "Due today" : `${days}d left`}
                          </Badge>
                        )}
                        {notSubmitted ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setTurnInId(isOpen ? null : a.id);
                              setLink("");
                              setNote("");
                            }}
                          >
                            {isOpen ? "Cancel" : "Turn in"}
                          </Button>
                        ) : awaiting ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={unsubmittingId === a.id}
                            onClick={() => handleUnsubmit(a.id)}
                            className="text-muted-foreground"
                          >
                            {unsubmittingId === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
                            <span className="ml-1">Withdraw</span>
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    {isOpen && (
                      <div className="mt-3 rounded-lg border bg-muted/40 p-3">
                        <div className="mb-2 flex items-center gap-1 text-xs font-medium text-card-foreground">
                          <LinkIcon size={12} /> Attach your work
                        </div>
                        <div className="space-y-2">
                          <Input
                            placeholder="Paste a URL link to your work"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                          />
                          <Textarea
                            placeholder="Add a note for your teacher (optional)"
                            rows={2}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                          />
                        </div>
                        <div className="mt-2 flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setTurnInId(null);
                              setLink("");
                              setNote("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button size="sm" disabled={submitting} onClick={() => handleTurnIn(a.id)}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            <span className="ml-1">{submitting ? "Turning in..." : "Turn in"}</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StudentShell>
  );
}
