"use client";

import { useActionState, useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/actions";
import { toast } from "@/lib/toast";

export function ForgotPasswordDialog() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(requestPasswordReset, null);

  useEffect(() => {
    if (state && "success" in state) {
      toast.success("If that email is on file, we've sent a reset link.");
      setOpen(false);
    }
  }, [state]);

  const errorMessage = state && "error" in state ? state.error : null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger className="text-sm font-medium text-foreground underline-offset-4 transition-colors hover:underline">
        Forgot password?
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form action={action} className="grid gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset your password</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the email tied to your account. We'll send you a link to
              choose a new password.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="reset-email">Email</Label>
            <Input
              id="reset-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={pending}
            />
            {errorMessage && (
              <p className="text-sm text-destructive">{errorMessage}</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={pending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction type="submit" disabled={pending}>
              {pending ? "Sending…" : "Send reset link"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
