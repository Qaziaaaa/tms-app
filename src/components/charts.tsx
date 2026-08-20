"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AttendanceBarChartProps {
  data: Array<{
    name: string;
    present: number;
    absent: number;
    late: number;
  }>;
}

export function AttendanceBarChart({ data }: AttendanceBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="name" className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip />
        <Legend />
        <Bar dataKey="present" fill="hsl(142, 76%, 36%)" name="Present" radius={[2, 2, 0, 0]} />
        <Bar dataKey="absent" fill="hsl(0, 84%, 60%)" name="Absent" radius={[2, 2, 0, 0]} />
        <Bar dataKey="late" fill="hsl(48, 96%, 50%)" name="Late" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface ClassAttendanceChartProps {
  data: Array<{
    name: string;
    averageAttendance: number;
  }>;
}

export function ClassAttendanceChart({ data }: ClassAttendanceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="name" className="text-xs" />
        <YAxis domain={[0, 100]} className="text-xs" />
        <Tooltip />
        <Bar dataKey="averageAttendance" fill="hsl(221, 83%, 53%)" name="Avg Attendance %" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface SubmissionBarSimpleProps {
  submitted: number;
  notSubmitted: number;
}

export function SubmissionBarSimple({ submitted, notSubmitted }: SubmissionBarSimpleProps) {
  const data = [
    { name: "Submitted", value: submitted, fill: "hsl(142, 76%, 36%)" },
    { name: "Not Submitted", value: notSubmitted, fill: "hsl(0, 84%, 60%)" },
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis type="number" className="text-xs" />
        <YAxis type="category" dataKey="name" className="text-xs" width={100} />
        <Tooltip />
        <Bar dataKey="value" radius={[0, 2, 2, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface AttendancePieChartProps {
  present: number;
  absent: number;
  late: number;
}

const PIE_COLORS = [
  "hsl(142, 76%, 36%)",
  "hsl(0, 84%, 60%)",
  "hsl(48, 96%, 50%)",
];

export function AttendancePieChart({ present, absent, late }: AttendancePieChartProps) {
  const data = [
    { name: "Present", value: present },
    { name: "Absent", value: absent },
    { name: "Late", value: late },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
        No attendance data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={70}
          paddingAngle={4}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
