"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import * as React from "react";
import { subscribeToToasts, type ToastItem, type ToastType } from "@/lib/toast";
import { cn } from "@/lib/utils";

const icons: Record<ToastType, React.ElementType> = {
  success: CircleCheckIcon,
  error: OctagonXIcon,
  info: InfoIcon,
  warning: TriangleAlertIcon,
};

const toastVariantClasses: Record<ToastType, string> = {
  success:
    "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200",
  error:
    "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
  info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
  warning:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
};

const positionClasses: Record<string, string> = {
  "top-right": "top-4 right-4 items-end",
  "top-left": "top-4 left-4 items-start",
  "bottom-right": "bottom-4 right-4 items-end",
  "bottom-left": "bottom-4 left-4 items-start",
  "top-center": "top-4 left-1/2 -translate-x-1/2 items-center",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
};

function Toaster({ position = "top-right" }: { position?: string }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  React.useEffect(() => subscribeToToasts(setToasts), []);

  return (
    <div
      className={cn(
        "pointer-events-none fixed z-[100] flex flex-col gap-2",
        positionClasses[position] ?? positionClasses["top-right"],
      )}
    >
      {toasts.map((t) => {
        const Icon = icons[t.type];
        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex min-w-64 max-w-sm items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-md animate-in slide-in-from-right-5 fade-in-0",
              toastVariantClasses[t.type],
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="flex-1">{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}

export { Toaster };
