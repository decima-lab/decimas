"use client";

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
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [categoryId, setCategoryId] = useState<string>(UNCATEGORISED);
  const [isVerified, setIsVerified] = useState(false);
  const [isGlobal, setIsGlobal] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  // Reset form when dialog opens / post changes
  useEffect(() => {
    if (open) {
      setLabel(post?.label ?? "");
      setDescription(post?.description ?? "");
      setLink(post?.link ?? "");
      setCategoryId(post?.category?.id ?? UNCATEGORISED);
      setIsVerified(post?.is_verified ?? false);
      setIsGlobal(post?.is_global ?? false);
      setSelectedTagIds(post?.post_tag_mapping.map((m) => m.tag.id) ?? []);
    }
  }, [open, post]);

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

    const input: PostInput = {
      label: label.trim(),
      description: description.trim() || null,
      link: link.trim() || null,
      categoryId: categoryId === UNCATEGORISED ? null : categoryId,
      isVerified,
      isGlobal,
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
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit post" : "New post"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details for this post."
              : "Posts start as drafts. An admin must publish before they go live."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">Title</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Acme Side Hustle"
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
