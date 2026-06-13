"use client";

import {
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Globe,
  Loader2,
  Search as SearchIcon,
  Star,
} from "lucide-react";
import Link from "next/link";
import {
  type ReadonlyURLSearchParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PostCard } from "@/components/ui/post-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

const ALL_CATEGORIES = "all";

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

export type PostsListProps = {
  posts: PostListItem[];
  categories: { id: string; label: string }[];
  total: number;
  page: number;
  pageCount: number;
};

const SEARCH_DEBOUNCE_MS = 300;

export function PostsList({
  posts,
  categories,
  total,
  page,
  pageCount,
}: PostsListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("q") ?? "";
  const currentCategory = searchParams.get("category") ?? ALL_CATEGORIES;
  const verifiedOnly = searchParams.get("verified") === "1";

  const [selected, setSelected] = useState<PostListItem | null>(null);
  const [open, setOpen] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build a URL from the current params with overrides applied, then navigate.
  // Any filter change drops the `page` param so results restart at page 1.
  // Routing inside a transition keeps `isPending` true until the server sends
  // the next page, which drives the loading state below.
  function applyParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    params.delete("page");
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  function onSearchChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      applyParams({ q: value.trim() || null });
    }, SEARCH_DEBOUNCE_MS);
  }

  function goToPage(href: string) {
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  function openPost(post: PostListItem) {
    setSelected(post);
    setOpen(true);
  }

  const selectedCategoryLabel =
    categories.find((c) => c.id === currentCategory)?.label ?? "All categories";

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Explore Opportunities</h2>
        <span className="shrink-0 text-sm text-muted-foreground">
          {total === 1
            ? "1 available offer now"
            : `${total} available offers now`}
        </span>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            defaultValue={currentSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search offer by name or keyword..."
            className="h-12 pl-10 text-base"
          />
        </div>

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <span className="text-sm font-medium text-muted-foreground">
            Filters:
          </span>

          <Select
            value={currentCategory}
            onValueChange={(value) =>
              applyParams({
                category: value === ALL_CATEGORIES ? null : value,
              })
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue>{selectedCategoryLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) =>
                applyParams({ verified: e.target.checked ? "1" : null })
              }
              className="size-4 cursor-pointer rounded accent-primary"
            />
            <span className="text-sm text-foreground">Verified only</span>
          </label>
        </div>
      </div>

      <div className="relative">
        {isPending && (
          <div className="absolute inset-0 z-10 flex items-start justify-center pt-12">
            <div className="flex items-center gap-2 rounded-full bg-popover px-3 py-1.5 text-sm text-muted-foreground shadow-sm ring-1 ring-foreground/10">
              <Loader2 className="size-4 animate-spin" />
              Loading…
            </div>
          </div>
        )}

        {posts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
            No offers match your search
          </div>
        ) : (
          <div
            className={cn(
              "grid gap-4 transition-opacity",
              isPending && "pointer-events-none opacity-50",
            )}
          >
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
                onSelect={() => openPost(post)}
              />
            ))}
          </div>
        )}
      </div>

      <Pagination
        page={page}
        pageCount={pageCount}
        pathname={pathname}
        searchParams={searchParams}
        onNavigate={goToPage}
      />

      <PostDetail open={open} onOpenChange={setOpen} post={selected} />
    </>
  );
}

type PageItem = { kind: "page"; value: number } | { kind: "gap"; key: string };

// First, last, and the current page ± 1 are always shown; larger gaps collapse
// into an ellipsis so the control stays compact for long result sets.
function pageItems(current: number, total: number): PageItem[] {
  const delta = 1;
  const visible: number[] = [];
  for (let i = 1; i <= total; i++) {
    if (
      i === 1 ||
      i === total ||
      (i >= current - delta && i <= current + delta)
    )
      visible.push(i);
  }
  const items: PageItem[] = [];
  let prev = 0;
  for (const value of visible) {
    if (prev && value - prev > 1)
      items.push({ kind: "gap", key: `gap-${prev}-${value}` });
    items.push({ kind: "page", value });
    prev = value;
  }
  return items;
}

function Pagination({
  page,
  pageCount,
  pathname,
  searchParams,
  onNavigate,
}: {
  page: number;
  pageCount: number;
  pathname: string;
  searchParams: ReadonlyURLSearchParams;
  onNavigate: (href: string) => void;
}) {
  if (pageCount <= 1) return null;

  function hrefFor(target: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (target <= 1) params.delete("page");
    else params.set("page", String(target));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1 pt-2"
    >
      <PageLink
        href={hrefFor(page - 1)}
        disabled={page <= 1}
        ariaLabel="Previous page"
        onNavigate={onNavigate}
      >
        <ChevronLeft className="size-4" />
      </PageLink>

      {pageItems(page, pageCount).map((item) =>
        item.kind === "gap" ? (
          <span
            key={item.key}
            className="px-1.5 text-sm text-muted-foreground"
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <PageLink
            key={item.value}
            href={hrefFor(item.value)}
            active={item.value === page}
            ariaLabel={`Page ${item.value}`}
            ariaCurrent={item.value === page}
            onNavigate={onNavigate}
          >
            {item.value}
          </PageLink>
        ),
      )}

      <PageLink
        href={hrefFor(page + 1)}
        disabled={page >= pageCount}
        ariaLabel="Next page"
        onNavigate={onNavigate}
      >
        <ChevronRight className="size-4" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  active = false,
  disabled = false,
  ariaLabel,
  ariaCurrent = false,
  onNavigate,
  children,
}: {
  href: string;
  active?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  ariaCurrent?: boolean;
  onNavigate: (href: string) => void;
  children: React.ReactNode;
}) {
  const className = cn(
    buttonVariants({
      variant: active ? "default" : "outline",
      size: "icon-sm",
    }),
    "min-w-8 tabular-nums",
    disabled && "pointer-events-none opacity-50",
  );

  if (disabled) {
    return <span className={className}>{children}</span>;
  }

  // Real anchors keep prefetch and open-in-new-tab working; a plain left click
  // is intercepted so navigation runs through the transition (loading state).
  return (
    <Link
      href={href}
      scroll={false}
      aria-label={ariaLabel}
      aria-current={ariaCurrent ? "page" : undefined}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        onNavigate(href);
      }}
    >
      {children}
    </Link>
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
          <div className="space-y-2 pr-8">
            <div className="flex min-w-0 items-center gap-2">
              <div className="size-5 shrink-0 overflow-hidden rounded-md">
                {post.logoUrl ? (
                  // biome-ignore lint/performance/noImgElement: arbitrary external logo URL
                  <img
                    src={post.logoUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center rounded-md bg-muted text-muted-foreground ring-1 ring-foreground/10">
                    <Globe className="size-3" />
                  </div>
                )}
              </div>
              <DialogTitle className="min-w-0 text-lg leading-tight">
                {post.label}
              </DialogTitle>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {post.category && (
                <Badge variant="outline">{post.category}</Badge>
              )}
              {post.isVerified && (
                <Badge variant="success">
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
        </div>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          {post.link && (
            <a
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants()}
            >
              View offer
              <ArrowUpRight />
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
