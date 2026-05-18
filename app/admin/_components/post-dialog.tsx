"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
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

type Category = { id: string; label: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: AdminPost | null;
  categories: Category[];
  isAdmin: boolean;
};

const UNCATEGORISED = "__none__";

export function PostDialog({
  open,
  onOpenChange,
  post,
  categories,
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

  // Reset form when dialog opens / post changes
  useEffect(() => {
    if (open) {
      setLabel(post?.label ?? "");
      setDescription(post?.description ?? "");
      setLink(post?.link ?? "");
      setCategoryId(post?.category?.id ?? UNCATEGORISED);
      setIsVerified(post?.is_verified ?? false);
      setIsGlobal(post?.is_global ?? false);
    }
  }, [open, post]);

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
