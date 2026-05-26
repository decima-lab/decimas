"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";
import { signIn } from "@/lib/actions";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/";
  const [state, action, pending] = useActionState(signIn, null);

  return (
    <form action={action}>
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required />
      </div>
      {state?.error && <p>{state.error}</p>}
      <button type="submit" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div>
      <h1>Login</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
