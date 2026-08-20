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

interface AttendanceRecord {
  id: string;
  status: string;
  session: {
    id: string;
    date: string;
    class: { name: string };
  };
}

interface AttendanceData {
  records: AttendanceRecord[];
  summary: {
    present: number;
    absent: number;
    late: number;
    totalDays: number;
    percentage: number;
  };
}

export default function StudentAttendance() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      fetch("/api/student/attendance")
        .then((r) => r.json())
        .then((json) => setData(json.data))
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
        <h1 className="text-2xl font-bold">My Attendance</h1>

        {loading ? (
          <Skeleton className="h-24" />
        ) : data?.summary && (
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{data.summary.present}</p>
                <p className="text-sm text-muted-foreground">Present</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{data.summary.absent}</p>
                <p className="text-sm text-muted-foreground">Absent</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">{data.summary.late}</p>
                <p className="text-sm text-muted-foreground">Late</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{data.summary.percentage}%</p>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attendance History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : data?.records.length === 0 ? (
              <p className="text-sm text-muted-foreground">No attendance records yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {new Date(record.session.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>{record.session.class.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            record.status === "PRESENT"
                              ? "default"
                              : record.status === "ABSENT"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {record.status}
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
