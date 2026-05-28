"use client";

import { useActionState } from "react";
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
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { resetPassword } from "@/lib/actions";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPassword, null);

  return (
    <AuthShell>
      <Toaster position="top-right" />
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Set a new password</CardTitle>
          <CardDescription>
            Choose a new password. You'll be signed out so you can sign in
            again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="password">New password</Label>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="new-password"
                required
                minLength={8}
                disabled={pending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                autoComplete="new-password"
                required
                minLength={8}
                disabled={pending}
              />
            </div>
            {state?.error && (
              <p className="text-sm text-destructive" role="alert">
                {state.error}
              </p>
            )}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Updating…" : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
