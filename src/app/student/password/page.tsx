"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { StudentShell } from "@/components/layout/student-shell";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { KeyRound, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { changePassword } from "@/lib/api";
import { getErrorMessage } from "@/hooks/use-api-data";

export default function StudentPassword() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading" || !session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "New password must be at least 6 characters" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    setLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setMessage({ type: "success", text: "Password changed successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      if (session.user.mustChangePassword) {
        setTimeout(() => void signOut({ callbackUrl: "/login" }), 900);
      }
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <StudentShell user={{ name: session.user.name || "", email: session.user.email || "" }}>
      <div className="page-stack">
        <div>
          <h2 className="page-title">Change Password</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Keep your account secure by updating your password.</p>
        </div>

        {session.user.mustChangePassword && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/40">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              You must change your temporary password before you can access the portal.
            </p>
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
              Enter your current password (<code className="font-mono">student123</code>) and choose a new one.
            </p>
          </div>
        )}

        <div className="surface md:max-w-xl">
          <div className="surface-header flex items-center gap-1.5">
            <KeyRound size={18} className="text-primary" />
            <div>
              <h3 className="font-semibold text-card-foreground">Update Password</h3>
              <p className="text-[13px] text-muted-foreground">Enter your current and new password below.</p>
            </div>
          </div>

          <CardContent className="p-3 sm:p-4">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="current">Current Password <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input
                    id="current"
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((p) => !p)}
                    aria-label={showCurrent ? "Hide password" : "Show password"}
                    className="absolute right-2.5 top-1/2 flex -translate-y-1/2 cursor-pointer items-center border-0 bg-transparent p-0.5 text-muted-foreground"
                  >
                    {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new">New Password <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input
                    id="new"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="pr-10"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((p) => !p)}
                    aria-label={showNew ? "Hide password" : "Show password"}
                    className="absolute right-2.5 top-1/2 flex -translate-y-1/2 cursor-pointer items-center border-0 bg-transparent p-0.5 text-muted-foreground"
                  >
                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm Password <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input
                    id="confirm"
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
                    onClick={() => setShowConfirm((p) => !p)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    className="absolute right-2.5 top-1/2 flex -translate-y-1/2 cursor-pointer items-center border-0 bg-transparent p-0.5 text-muted-foreground"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {message && (
                <p
                  className={`flex items-center gap-1.5 text-sm sm:col-span-2 ${
                    message.type === "success" ? "text-primary" : "text-destructive"
                  }`}
                >
                  <ShieldCheck size={16} />
                  {message.text}
                </p>
              )}

              <div className="sm:col-span-2">
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? "Saving..." : "Change Password"}
                </Button>
              </div>
            </form>
          </CardContent>
        </div>
      </div>
    </StudentShell>
  );
}
