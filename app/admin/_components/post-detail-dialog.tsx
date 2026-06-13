"use client";

import { CheckCircle2Icon, Globe, PencilIcon, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/currency";
import type { AdminPost } from "@/lib/posts";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: AdminPost | null;
  canEdit: boolean;
  onEdit: (post: AdminPost) => void;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function EffortStars({ value }: { value: number }) {
  return (
    <div
      role="img"
      className="flex items-center gap-0.5"
      aria-label={`Effort ${value} of 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "size-4",
            n <= value
              ? "fill-primary text-primary"
              : "text-muted-foreground/40",
          )}
        />
      ))}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export function PostDetailDialog({
  open,
  onOpenChange,
  post,
  canEdit,
  onEdit,
}: Props) {
  if (!post) return null;

  const tags = post.post_tag_mapping.map((m) => m.tag.label);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-start gap-3 pr-8">
            <div className="size-12 shrink-0 overflow-hidden rounded-lg ring-1 ring-foreground/10">
              {post.logo_url ? (
                // biome-ignore lint/performance/noImgElement: arbitrary external logo URL
                <img
                  src={post.logo_url}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-muted text-muted-foreground">
                  <Globe className="size-5" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <DialogTitle className="text-lg leading-tight">
                {post.label}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-1.5">
                {post.category && (
                  <Badge variant="outline">{post.category.label}</Badge>
                )}
                {post.is_verified && (
                  <Badge variant="secondary">
                    <CheckCircle2Icon /> Verified
                  </Badge>
                )}
                {post.is_global && (
                  <Badge variant="outline">
                    <Globe /> Global
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="-mx-2 min-h-0 flex-1 space-y-5 overflow-y-auto px-2">
          {post.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {post.description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Effort level">
              <EffortStars value={post.effort_level} />
            </Field>
            <Field label="Earn up to">
              {post.earn_up_to_amount > 0 ? (
                <span className="font-medium tabular-nums">
                  {formatCurrency(
                    post.earn_up_to_amount,
                    post.earn_up_to_currency,
                  )}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </Field>
          </div>

          {tags.length > 0 && (
            <Field label="Tags">
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </Field>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Slug">
              <span className="font-mono text-xs">{post.slug}</span>
            </Field>
            <Field label="Added">
              {dateFormatter.format(new Date(post.created_at))}
            </Field>
          </div>

          {post.link && (
            <Field label="Link">
              <a
                href={post.link}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-primary underline underline-offset-4 hover:text-foreground"
              >
                {post.link}
              </a>
            </Field>
          )}
        </div>

        <div className="-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {canEdit && (
            <Button
              onClick={() => {
                onOpenChange(false);
                onEdit(post);
              }}
            >
              <PencilIcon className="size-4" />
              Edit
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
