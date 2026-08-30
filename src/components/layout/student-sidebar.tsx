import {
  LayoutDashboard,
  ClipboardCheck,
  FileText,
  BarChart3,
  Lock,
} from "lucide-react";

export const STUDENT_NAV_ITEMS = [
  { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "My Attendance", href: "/student/attendance", icon: ClipboardCheck },
  { label: "My Assignments", href: "/student/assignments", icon: FileText },
  { label: "My Grades", href: "/student/grades", icon: BarChart3 },
  { label: "Change Password", href: "/student/password", icon: Lock },
];
