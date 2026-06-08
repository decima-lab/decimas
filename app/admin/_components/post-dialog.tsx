"use client";

import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createPost, type PostInput, updatePost } from "@/lib/actions";
import { CURRENCIES } from "@/lib/currency";
import type { AdminPost } from "@/lib/posts";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type Category = { id: string; label: string };
type Tag = { id: string; label: string; category: string | null };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: AdminPost | null;
  categories: Category[];
  tags: Tag[];
  isAdmin: boolean;
};

const UNCATEGORISED = "__none__";

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= value;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            aria-pressed={active}
            className="rounded text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Star
              className={cn("size-6", active && "fill-primary text-primary")}
            />
          </button>
        );
      })}
    </div>
  );
}

export function PostDialog({
  open,
  onOpenChange,
  post,
  categories,
  tags,
  isAdmin,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [label, setLabel] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [categoryId, setCategoryId] = useState<string>(UNCATEGORISED);
  const [isVerified, setIsVerified] = useState(false);
  const [isGlobal, setIsGlobal] = useState(false);
  const [effortLevel, setEffortLevel] = useState(3);
  const [earnUpToAmount, setEarnUpToAmount] = useState("");
  const [earnUpToCurrency, setEarnUpToCurrency] = useState("USD");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  // Reset form when dialog opens / post changes
  useEffect(() => {
    if (open) {
      setLabel(post?.label ?? "");
      setSlug(post?.slug ?? "");
      setSlugTouched(post !== null);
      setDescription(post?.description ?? "");
      setLink(post?.link ?? "");
      setLogoUrl(post?.logo_url ?? "");
      setCategoryId(post?.category?.id ?? UNCATEGORISED);
      setIsVerified(post?.is_verified ?? false);
      setIsGlobal(post?.is_global ?? false);
      setEffortLevel(post?.effort_level ?? 3);
      setEarnUpToAmount(
        post?.earn_up_to_amount != null ? String(post.earn_up_to_amount) : "",
      );
      setEarnUpToCurrency(post?.earn_up_to_currency ?? "USD");
      setSelectedTagIds(post?.post_tag_mapping.map((m) => m.tag.id) ?? []);
    }
  }, [open, post]);

  function toSlug(text: string) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleLabelChange(value: string) {
    setLabel(value);
    if (!slugTouched) setSlug(toSlug(value));
  }

  function handleSlugChange(value: string) {
    setSlug(value);
    setSlugTouched(true);
  }

  // Group the predefined tags by their category for the picker.
  const tagGroups = useMemo(() => {
    const map = new Map<string, Tag[]>();
    for (const tag of tags) {
      const key = tag.category ?? "Other";
      const list = map.get(key) ?? [];
      list.push(tag);
      map.set(key, list);
    }
    return Array.from(map, ([category, items]) => ({ category, items }));
  }, [tags]);

  function toggleTag(id: string) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  const isEditing = post !== null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!slug.trim()) {
      toast.error("Slug is required");
      return;
    }
    if (categoryId === UNCATEGORISED) {
      toast.error("Category is required");
      return;
    }

    let earnUpTo = 0;
    if (earnUpToAmount.trim() !== "") {
      const n = Number(earnUpToAmount);
      if (!Number.isInteger(n) || n < 0) {
        toast.error("Earn up to must be a whole number of 0 or more");
        return;
      }
      earnUpTo = n;
    }

    const input: PostInput = {
      slug: slug.trim(),
      label: label.trim(),
      description: description.trim() || null,
      link: link.trim() || null,
      logoUrl: logoUrl.trim() || null,
      categoryId: categoryId,
      isVerified,
      isGlobal,
      effortLevel,
      earnUpToAmount: earnUpTo,
      earnUpToCurrency,
      tagIds: selectedTagIds,
    };

    startTransition(async () => {
      try {
        if (isEditing && post) {
          await updatePost(post.id, input);
          toast.success("Post updated");
        } else {
          await createPost(input);
          toast.success("Draft created");
        }
        onOpenChange(false);
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Something went wrong",
        );
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit post" : "New post"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details for this post."
              : "Posts start as drafts. An admin must publish before they go live."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col gap-4"
        >
          <div className="-mx-2 min-h-0 flex-1 space-y-4 overflow-y-auto px-2">
            <div className="space-y-2">
              <Label htmlFor="label">Title</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="e.g. Acme Side Hustle"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">
                Slug
                <span className="ml-2 text-xs text-muted-foreground font-normal">
                  used in the URL: /posts/<em>{slug || "your-slug"}</em>
                </span>
              </Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="e.g. acme-side-hustle"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this site about?"
                rows={3}
                className="max-h-[30vh] overflow-y-auto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">Link</Label>
              <Input
                id="link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://example.com"
                type="url"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <div className="flex items-center gap-3">
                {logoUrl.trim() ? (
                  // biome-ignore lint/performance/noImgElement: admin preview of an arbitrary external URL
                  <img
                    src={logoUrl.trim()}
                    alt=""
                    className="size-9 shrink-0 rounded border border-input object-contain"
                  />
                ) : (
                  <div className="size-9 shrink-0 rounded border border-dashed border-input" />
                )}
                <Input
                  id="logoUrl"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/favicon.ico"
                  type="url"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Effort level</Label>
                <StarRating value={effortLevel} onChange={setEffortLevel} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="earnUpTo">Earn up to</Label>
                <div className="flex gap-2">
                  <Input
                    id="earnUpTo"
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={earnUpToAmount}
                    onChange={(e) => setEarnUpToAmount(e.target.value)}
                    placeholder="500"
                  />
                  <Select
                    value={earnUpToCurrency}
                    onValueChange={(v) => setEarnUpToCurrency(v ?? "USD")}
                  >
                    <SelectTrigger id="currency" className="w-24 shrink-0">
                      <SelectValue>{earnUpToCurrency}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={categoryId}
                onValueChange={(v) => setCategoryId(v ?? UNCATEGORISED)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Uncategorised">
                    {categoryId === UNCATEGORISED
                      ? "Uncategorised"
                      : (categories.find((c) => c.id === categoryId)?.label ??
                        "Uncategorised")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNCATEGORISED}>Uncategorised</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {tagGroups.length > 0 && (
              <div className="space-y-3">
                <Label>Tags</Label>
                <div className="space-y-3">
                  {tagGroups.map(({ category, items }) => (
                    <div key={category} className="space-y-1.5">
                      <div className="text-xs font-medium text-muted-foreground">
                        {category}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {items.map((tag) => {
                          const selected = selectedTagIds.includes(tag.id);
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => toggleTag(tag.id)}
                              aria-pressed={selected}
                              className={cn(
                                "rounded-full border px-2.5 py-1 text-xs transition-colors",
                                selected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-input text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                              )}
                            >
                              {tag.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isAdmin && (
              <div className="flex gap-6 pt-1">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isVerified}
                    onChange={(e) => setIsVerified(e.target.checked)}
                    className="size-4 rounded border-input"
                  />
                  Verified
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isGlobal}
                    onChange={(e) => setIsGlobal(e.target.checked)}
                    className="size-4 rounded border-input"
                  />
                  Global
                </label>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending
                ? "Saving..."
                : isEditing
                  ? "Save changes"
                  : "Create draft"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
