"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useActionState, useEffect, useRef } from "react";
import { ForgotPasswordDialog } from "@/components/forgot-password-dialog";
import { PasswordInput } from "@/components/password-input";
import { AuthShell } from "@/components/ui/auth-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { signIn } from "@/lib/actions";
import { toast } from "@/lib/toast";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/";
  const resetStatus = searchParams.get("reset");
  const errorParam = searchParams.get("error");
  const [state, action, pending] = useActionState(signIn, null);

  const notifiedRef = useRef(false);
  useEffect(() => {
    if (notifiedRef.current) return;
    if (resetStatus === "success") {
      toast.success("Password updated — please sign in.");
      notifiedRef.current = true;
    } else if (errorParam === "invalid_link") {
      toast.error("That link is invalid or has expired.");
      notifiedRef.current = true;
    }
  }, [resetStatus, errorParam]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription>Welcome back. Sign in to continue.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={pending}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <ForgotPasswordDialog />
            </div>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              required
              disabled={pending}
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <AuthShell>
      <Toaster position="top-right" />
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
