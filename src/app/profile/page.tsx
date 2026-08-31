"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  User,
  Mail,
  Shield,
  Calendar,
  BookOpen,
  Users,
  ClipboardCheck,
  FileText,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Save,
} from "lucide-react";
import { getTeacherProfile, updateTeacherProfile, changeTeacherPassword } from "@/lib/api";
import { getErrorMessage } from "@/hooks/use-api-data";
import { getInitials } from "@/lib/utils";
import type { TeacherProfileDTO } from "@/types/api";

export default function TeacherProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<TeacherProfileDTO | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Name State
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      getTeacherProfile()
        .then((data) => {
          setProfile(data);
          setNameInput(data.name);
        })
        .catch(() => setProfile(null))
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

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || nameInput.trim() === profile?.name) return;

    setSavingName(true);
    setNameMessage(null);
    try {
      const res = await updateTeacherProfile({ name: nameInput.trim() });
      if (profile) {
        setProfile({ ...profile, name: res.name });
      }
      setNameMessage({ type: "success", text: "Profile name updated successfully!" });
      // Update session in next-auth if supported
      if (update) {
        await update({ name: res.name });
      }
    } catch (err) {
      setNameMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "New password must be at least 6 characters" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    setChangingPassword(true);
    try {
      await changeTeacherPassword({ currentPassword, newPassword });
      setPasswordMessage({ type: "success", text: "Password changed successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setChangingPassword(false);
    }
  };

  const displayName = profile?.name || session.user.name || "Teacher";
  const displayEmail = profile?.email || session.user.email || "";
  const joinedDate = profile?.joinedAt
    ? new Date(profile.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Recently";

  return (
    <AppShell user={{ name: displayName, email: displayEmail }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Teacher Profile</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage your account credentials and faculty overview.
          </p>
        </div>

        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 ring-4 ring-primary/10">
                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-card-foreground">{displayName}</h2>
                  <Badge variant="default" className="gap-1 bg-primary text-primary-foreground">
                    <Shield className="h-3 w-3" />
                    Faculty
                  </Badge>
                </div>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  {displayEmail}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  Member since {joinedDate}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Faculty Stats */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          ) : (
            <>
              <StatCard
                label="Assigned Classes"
                value={profile?.classesCount ?? 0}
                icon={BookOpen}
                iconBg="bg-blue-500/10 dark:bg-blue-500/20"
                iconColor="text-blue-600 dark:text-blue-400"
              />
              <StatCard
                label="Total Students"
                value={profile?.studentsCount ?? 0}
                icon={Users}
                iconBg="bg-emerald-500/10 dark:bg-emerald-500/20"
                iconColor="text-emerald-600 dark:text-emerald-400"
              />
              <StatCard
                label="Attendance Sessions"
                value={profile?.totalSessions ?? 0}
                icon={ClipboardCheck}
                iconBg="bg-amber-500/10 dark:bg-amber-500/20"
                iconColor="text-amber-600 dark:text-amber-400"
              />
              <StatCard
                label="Assignments Created"
                value={profile?.totalAssignments ?? 0}
                icon={FileText}
                iconBg="bg-purple-500/10 dark:bg-purple-500/20"
                iconColor="text-purple-600 dark:text-purple-400"
              />
            </>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Personal Information Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Personal Information</CardTitle>
              </div>
              <CardDescription>Update your personal display name and contact details.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateName} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="teacher-name">Full Name</Label>
                  <Input
                    id="teacher-name"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teacher-email">Email Address</Label>
                  <Input
                    id="teacher-email"
                    value={displayEmail}
                    disabled
                    className="bg-muted text-muted-foreground cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email address cannot be changed as it is tied to your institutional login.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Assigned Classes</Label>
                  {loading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : profile?.classes && profile.classes.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {profile.classes.map((cls) => (
                        <Badge key={cls.id} variant="secondary" className="px-2.5 py-1 text-xs">
                          {cls.name} ({cls.batch})
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No classes assigned yet.</p>
                  )}
                </div>

                {nameMessage && (
                  <div
                    className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                      nameMessage.type === "success"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {nameMessage.type === "success" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0" />
                    )}
                    <span>{nameMessage.text}</span>
                  </div>
                )}

                <Button type="submit" disabled={savingName || nameInput.trim() === profile?.name} className="gap-2">
                  <Save className="h-4 w-4" />
                  {savingName ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Security / Password Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Security & Password</CardTitle>
              </div>
              <CardDescription>Ensure your account stays secure by choosing a strong password.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-pw">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-pw"
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-pw">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-pw"
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min. 6 characters)"
                      className="pr-10"
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-pw">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-pw"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="pr-10"
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {passwordMessage && (
                  <div
                    className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                      passwordMessage.type === "success"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {passwordMessage.type === "success" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0" />
                    )}
                    <span>{passwordMessage.text}</span>
                  </div>
                )}

                <Button type="submit" disabled={changingPassword} variant="default">
                  {changingPassword ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
