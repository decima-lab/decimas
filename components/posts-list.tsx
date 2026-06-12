"use client";

import { ArrowUpRight, CheckCircle2, Globe, Star } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PostCard } from "@/components/ui/post-card";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

export type PostListItem = {
  id: string;
  label: string;
  category: string | null;
  description: string | null;
  link: string | null;
  logoUrl: string | null;
  tags: string[];
  isVerified: boolean;
  isGlobal: boolean;
  effortLevel: number;
  earnUpToAmount: number;
  earnUpToCurrency: string;
  createdAt: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function PostsList({ posts }: { posts: PostListItem[] }) {
  const [selected, setSelected] = useState<PostListItem | null>(null);
  const [open, setOpen] = useState(false);

  function openPost(post: PostListItem) {
    setSelected(post);
    setOpen(true);
  }

  return (
    <>
      <div className="grid gap-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            label={post.label}
            category={post.category}
            link={post.link}
            logoUrl={post.logoUrl}
            tags={post.tags}
            isVerified={post.isVerified}
            isGlobal={post.isGlobal}
            createdAt={post.createdAt}
            onSelect={() => openPost(post)}
          />
        ))}
      </div>

      <PostDetail open={open} onOpenChange={setOpen} post={selected} />
    </>
  );
}

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

function PostDetail({
  open,
  onOpenChange,
  post,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: PostListItem | null;
}) {
  if (!post) return null;

  const tags = post.tags.filter((tag) => tag.toLowerCase() !== "global");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-start gap-3 pr-8">
            <div className="size-12 shrink-0 overflow-hidden rounded-lg">
              {post.logoUrl ? (
                // biome-ignore lint/performance/noImgElement: arbitrary external logo URL
                <img
                  src={post.logoUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-foreground/10">
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
                  <Badge variant="outline">{post.category}</Badge>
                )}
                {post.isVerified && (
                  <Badge variant="secondary">
                    <CheckCircle2 /> Verified
                  </Badge>
                )}
                {post.isGlobal && (
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
              <EffortStars value={post.effortLevel} />
            </Field>
            {post.earnUpToAmount > 0 && (
              <Field label="Earn up to">
                <span className="font-medium tabular-nums">
                  {formatCurrency(post.earnUpToAmount, post.earnUpToCurrency)}
                </span>
              </Field>
            )}
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

          <Field label="Added">
            {dateFormatter.format(new Date(post.createdAt))}
          </Field>
        </div>

        <div className="-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end">
          {post.link && (
            <a
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants()}
            >
              Visit site
              <ArrowUpRight />
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
