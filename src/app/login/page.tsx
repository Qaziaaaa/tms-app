"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, BookOpen, Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"teacher" | "student">("teacher");
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const target = session.user.role === "student" ? "/student/dashboard" : "/dashboard";
      router.push(target);
    }
  }, [status, session, router]);

  function validate(identifier: string, password: string) {
    const errors: { email?: string; password?: string } = {};
    if (!identifier) errors.email = role === "student" ? "Email or roll number is required" : "Email is required";
    else if (role === "teacher" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) errors.email = "Enter a valid email";
    if (!password) errors.password = "Password is required";
    else if (password.length < 6) errors.password = "Password must be at least 6 characters";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const identifier = formData.get("identifier") as string;
    const password = formData.get("password") as string;

    if (!validate(identifier, password)) return;

    setLoading(true);

    try {
      const result = await signIn("credentials", {
        identifier,
        portal: role,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please check your credentials and try again.");
      } else if (role === "student") {
        window.location.href = "/student/dashboard";
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const formId = role === "teacher" ? "login-form" : "student-form";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className={`w-full max-w-md transition-all duration-500 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
        <Card className="card-shadow-lg border-0">
          <CardHeader className="space-y-3 text-center pb-2">
            <div className="flex justify-center">
              <div className="rounded-2xl bg-primary p-3 shadow-lg">
                <GraduationCap className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight">Welcome to TMS</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <Tabs value={role} onValueChange={(v) => { setRole(v as "teacher" | "student"); setError(null); setFieldErrors({}); }}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="teacher" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Teacher
                </TabsTrigger>
                <TabsTrigger value="student" className="gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Student
                </TabsTrigger>
              </TabsList>

              <TabsContent value="teacher">
                <form id={formId} onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        name="identifier"
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        className={`pl-10 ${fieldErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                    </div>
                    {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        className={`pl-10 pr-10 ${fieldErrors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
                  </div>

                  <Button type="submit" className="w-full h-11" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Signing in...
                      </span>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="student">
                <form id={formId} onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="student-email">Email or Roll Number</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="student-email"
                        name="identifier"
                        type="text"
                        placeholder="ali33@uop.edu or SE-01-33"
                        autoComplete="username"
                        className={`pl-10 ${fieldErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                    </div>
                    {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
                  </div>

                  <p className="rounded-lg border bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
                    New students can sign in with their roll number (e.g. SE-01-33) or email (e.g. ali33@uop.edu). You must change your temporary password after first sign-in.
                  </p>

                  <div className="space-y-2">
                    <Label htmlFor="student-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="student-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        className={`pl-10 pr-10 ${fieldErrors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
                  </div>

                  <Button type="submit" className="w-full h-11" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Signing in...
                      </span>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Teaching Management System &middot; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
