"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import type * as React from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type">) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <Input
        {...props}
        type={shown ? "text" : "password"}
        className={cn("pr-9", className)}
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? "Hide password" : "Show password"}
        className="absolute top-1/2 right-1.5 -translate-y-1/2 inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {shown ? (
          <EyeOffIcon className="size-3.5" />
        ) : (
          <EyeIcon className="size-3.5" />
        )}
      </button>
    </div>
  );
}
