import { ArrowUpRight, CheckCircle2, Globe } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import { buttonVariants } from "./button";
import { Card, CardTitle } from "./card";

export type PostCardProps = {
  label: string;
  category: string | null;
  link: string | null;
  logoUrl: string | null;
  tags: string[];
  isVerified: boolean;
  isGlobal: boolean;
  onSelect?: () => void;
};

const TAG_LIMIT = 4;

export function PostCard({
  label,
  category,
  link,
  logoUrl,
  tags,
  isVerified,
  isGlobal,
  onSelect,
}: PostCardProps) {
  // The `is_global` badge already conveys global scope, so drop a redundant
  // "Global" tag from the chip row.
  const chipTags = tags.filter((tag) => tag.toLowerCase() !== "global");
  const visibleTags = chipTags.slice(0, TAG_LIMIT);
  const overflowCount = chipTags.length - visibleTags.length;

  const interactive = onSelect
    ? {
        role: "button" as const,
        tabIndex: 0,
        onClick: onSelect,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        },
      }
    : {};

  return (
    <Card
      {...interactive}
      className={cn(
        "flex-col gap-4 p-4 sm:flex-row sm:items-center",
        onSelect &&
          "cursor-pointer transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <div className="size-5 shrink-0 overflow-hidden rounded-md">
              {logoUrl ? (
                // biome-ignore lint/performance/noImgElement: arbitrary external logo URL
                <img
                  src={logoUrl}
                  alt=""
                  width={20}
                  height={20}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center rounded-md bg-muted text-muted-foreground ring-1 ring-foreground/10">
                  <Globe className="size-3" />
                </div>
              )}
            </div>
            <CardTitle className="text-lg">{label}</CardTitle>
            {category && <Badge variant="outline">{category}</Badge>}
          </div>
          {(isVerified || isGlobal) && (
            <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
              {isVerified && (
                <Badge variant="success">
                  <CheckCircle2 /> Verified
                </Badge>
              )}
              {isGlobal && (
                <Badge variant="outline">
                  <Globe /> Global
                </Badge>
              )}
            </div>
          )}
        </div>

        {visibleTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {visibleTags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
            {overflowCount > 0 && (
              <Badge variant="ghost">+{overflowCount} more</Badge>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-full sm:w-auto",
            )}
          >
            View offer
            <ArrowUpRight />
          </a>
        )}
      </div>
    </Card>
  );
}
