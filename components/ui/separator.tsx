import type * as React from "react";
import { cn } from "@/lib/utils";

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<"div"> & {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}) {
  const ariaProps = decorative
    ? {}
    : { role: "separator" as const, "aria-orientation": orientation };

  return (
    <div
      data-slot="separator"
      role={decorative ? "none" : undefined}
      {...ariaProps}
      {...(orientation === "horizontal"
        ? { "data-horizontal": "" }
        : { "data-vertical": "" })}
      className={cn(
        "shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
