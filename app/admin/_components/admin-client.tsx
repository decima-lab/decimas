"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  FileTextIcon,
  LogOutIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
  SendIcon,
  Trash2Icon,
  UndoIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  deletePost,
  demoteUser,
  promoteUser,
  publishPost,
  restorePost,
  signOut,
  unpublishPost,
} from "@/lib/actions";
import type { Role } from "@/lib/auth";
import type { AdminPost } from "@/lib/posts";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { PostDetailDialog } from "./post-detail-dialog";
import { PostDialog } from "./post-dialog";

type Category = { id: string; label: string };
type Tag = { id: string; label: string; category: string | null };
type AdminUser = { id: string; email: string; roles: string[] };

type Props = {
  currentUser: { id: string; email: string; isAdmin: boolean };
  posts: AdminPost[];
  categories: Category[];
  tags: Tag[];
  users: AdminUser[];
  metrics: {
    totalPosts: number;
    drafts: number;
    published: number;
    editorCount: number;
  };
};

export function AdminClient({
  currentUser,
  posts,
  categories,
  tags,
  users,
  metrics,
}: Props) {
  return (
    <div className="min-h-svh bg-background">
      <Toaster position="top-right" />
      <PageHeader currentUser={currentUser} />
      <main className="mx-auto w-full max-w-6xl px-6 py-8 space-y-8">
        <MetricsRow metrics={metrics} isAdmin={currentUser.isAdmin} />

        <Tabs defaultValue="posts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            {currentUser.isAdmin && (
              <TabsTrigger value="users">Users</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="posts">
            <PostsPanel
              posts={posts}
              categories={categories}
              tags={tags}
              currentUser={currentUser}
            />
          </TabsContent>

          {currentUser.isAdmin && (
            <TabsContent value="users">
              <UsersPanel users={users} currentUserId={currentUser.id} />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}

// ---------- Page header ----------

function PageHeader({ currentUser }: { currentUser: Props["currentUser"] }) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="text-base font-semibold tracking-tight">
            decimas
            <span className="ml-2 text-muted-foreground font-normal">
              / admin
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Badge variant="outline" className="font-normal">
            {currentUser.isAdmin ? "Admin" : "Editor"}
          </Badge>
          <span className="text-muted-foreground">{currentUser.email}</span>
          <form action={signOut}>
            <Button variant="outline" size="sm" type="submit">
              <LogOutIcon className="size-4" />
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}

// ---------- Metric cards ----------

function MetricsRow({
  metrics,
  isAdmin,
}: {
  metrics: Props["metrics"];
  isAdmin: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <MetricCard
        label="Total Posts"
        value={metrics.totalPosts}
        hint="Active, not deleted"
      />
      <MetricCard
        label="Drafts"
        value={metrics.drafts}
        hint="Awaiting publish"
        accent={metrics.drafts > 0 ? "warning" : undefined}
      />
      <MetricCard
        label="Published"
        value={metrics.published}
        hint="Live on the site"
      />
      <MetricCard
        label="Editors"
        value={metrics.editorCount}
        hint={isAdmin ? "Promoted editors" : "Admin only"}
        disabled={!isAdmin}
      />
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  accent,
  disabled,
}: {
  label: string;
  value: number;
  hint?: string;
  accent?: "warning";
  disabled?: boolean;
}) {
  return (
    <Card className={disabled ? "opacity-60" : undefined}>
      <CardHeader className="pb-2">
        <CardDescription className="text-xs uppercase tracking-wide">
          {label}
        </CardDescription>
        <CardTitle className="text-3xl tabular-nums">
          {disabled ? "—" : value}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={`text-xs ${accent === "warning" && !disabled ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}
        >
          {hint}
        </p>
      </CardContent>
    </Card>
  );
}

// ---------- Posts panel ----------

const PAGE_SIZE = 25;
const ALL = "all";

type StatusFilter = "active" | "draft" | "published" | "deleted";
type SortKey = "title" | "category" | "status";
type SortDir = "asc" | "desc";

const STATUS_LABELS: Record<StatusFilter, string> = {
  active: "Active",
  draft: "Drafts",
  published: "Published",
  deleted: "Deleted",
};

function matchesStatus(post: AdminPost, status: StatusFilter): boolean {
  switch (status) {
    case "active":
      return !post.is_deleted;
    case "draft":
      return !post.is_deleted && post.status === "draft";
    case "published":
      return !post.is_deleted && post.status === "published";
    case "deleted":
      return post.is_deleted;
  }
}

function comparePosts(a: AdminPost, b: AdminPost, key: SortKey): number {
  switch (key) {
    case "title":
      return a.label.localeCompare(b.label);
    case "category":
      return (a.category?.label ?? "").localeCompare(b.category?.label ?? "");
    case "status":
      return a.status.localeCompare(b.status);
  }
}

function PostsPanel({
  posts,
  categories,
  tags,
  currentUser,
}: {
  posts: AdminPost[];
  categories: Category[];
  tags: Tag[];
  currentUser: Props["currentUser"];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<AdminPost | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [viewingPost, setViewingPost] = useState<AdminPost | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // ---- Filter + sort + pagination state ----
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>(ALL);
  const [status, setStatus] = useState<StatusFilter>("active");
  const [tagId, setTagId] = useState<string>(ALL);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);

  const hasActiveFilters =
    search.trim() !== "" ||
    categoryId !== ALL ||
    status !== "active" ||
    tagId !== ALL ||
    verifiedOnly;

  function clearFilters() {
    setSearch("");
    setCategoryId(ALL);
    setStatus("active");
    setTagId(ALL);
    setVerifiedOnly(false);
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = posts.filter((post) => {
      if (!matchesStatus(post, status)) return false;
      if (query && !post.label.toLowerCase().includes(query)) return false;
      if (categoryId !== ALL && post.category?.id !== categoryId) return false;
      if (
        tagId !== ALL &&
        !post.post_tag_mapping.some((m) => m.tag.id === tagId)
      ) {
        return false;
      }
      if (verifiedOnly && !post.is_verified) return false;
      return true;
    });
    result.sort((a, b) => {
      const cmp = comparePosts(a, b, sortKey);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [
    posts,
    search,
    status,
    categoryId,
    tagId,
    verifiedOnly,
    sortKey,
    sortDir,
  ]);

  const pageCount = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));

  // Keep the page in range when filters shrink the result set.
  useEffect(() => {
    setPage((p) => Math.min(p, pageCount - 1));
  }, [pageCount]);

  // Reset to the first page whenever the filtered/sorted set changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on filter changes
  useEffect(() => {
    setPage(0);
  }, [search, status, categoryId, tagId, verifiedOnly, sortKey, sortDir]);

  const pagePosts = filteredPosts.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE,
  );

  const deleteTarget = posts.find((p) => p.id === pendingDeleteId);

  function openNew() {
    setEditingPost(null);
    setDialogOpen(true);
  }

  function openEdit(post: AdminPost) {
    setEditingPost(post);
    setDialogOpen(true);
  }

  function openDetail(post: AdminPost) {
    setViewingPost(post);
    setDetailOpen(true);
  }

  function canEditPost(post: AdminPost): boolean {
    if (post.is_deleted) return false;
    const isOwn = post.created_by === currentUser.id;
    return currentUser.isAdmin || (isOwn && post.status === "draft");
  }

  function runAction(action: () => Promise<void>, successMessage: string) {
    startTransition(async () => {
      try {
        await action();
        toast.success(successMessage);
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Something went wrong",
        );
      }
    });
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Posts</CardTitle>
            <CardDescription>
              {currentUser.isAdmin
                ? "Manage every post in the directory."
                : "Your drafts and submissions."}
            </CardDescription>
          </div>
          <Button onClick={openNew} size="sm">
            <PlusIcon className="size-4" />
            New post
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {posts.length === 0 ? (
            <EmptyState
              icon={<FileTextIcon className="size-8 text-muted-foreground" />}
              title="No posts yet"
              description="Create your first post — it will start as a draft."
              action={
                <Button onClick={openNew} size="sm" variant="outline">
                  <PlusIcon className="size-4" />
                  New post
                </Button>
              }
            />
          ) : (
            <>
              <PostFilters
                search={search}
                onSearchChange={setSearch}
                categoryId={categoryId}
                onCategoryChange={setCategoryId}
                categories={categories}
                status={status}
                onStatusChange={setStatus}
                tagId={tagId}
                onTagChange={setTagId}
                tags={tags}
                verifiedOnly={verifiedOnly}
                onVerifiedOnlyChange={setVerifiedOnly}
                hasActiveFilters={hasActiveFilters}
                onClear={clearFilters}
              />
              {filteredPosts.length === 0 ? (
                <EmptyState
                  icon={<SearchIcon className="size-8 text-muted-foreground" />}
                  title="No posts match your filters"
                  description="Try adjusting or clearing the filters above."
                  action={
                    <Button onClick={clearFilters} size="sm" variant="outline">
                      <XIcon className="size-4" />
                      Clear filters
                    </Button>
                  }
                />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <SortableHead
                            label="Title"
                            sortKey="title"
                            activeKey={sortKey}
                            dir={sortDir}
                            onSort={toggleSort}
                          />
                          <SortableHead
                            label="Category"
                            sortKey="category"
                            activeKey={sortKey}
                            dir={sortDir}
                            onSort={toggleSort}
                          />
                          <SortableHead
                            label="Status"
                            sortKey="status"
                            activeKey={sortKey}
                            dir={sortDir}
                            onSort={toggleSort}
                          />
                          <TableHead className="w-[1%]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagePosts.map((post) => (
                          <PostRow
                            key={post.id}
                            post={post}
                            isAdmin={currentUser.isAdmin}
                            currentUserId={currentUser.id}
                            pending={pending}
                            onView={openDetail}
                            onEdit={openEdit}
                            onPublish={(id) =>
                              runAction(() => publishPost(id), "Post published")
                            }
                            onUnpublish={(id) =>
                              runAction(
                                () => unpublishPost(id),
                                "Moved back to drafts",
                              )
                            }
                            onDelete={(id) => setPendingDeleteId(id)}
                            onRestore={(id) =>
                              runAction(() => restorePost(id), "Post restored")
                            }
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <PostsPagination
                    page={page}
                    pageCount={pageCount}
                    total={filteredPosts.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setPage}
                  />
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <PostDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        post={editingPost}
        categories={categories}
        tags={tags}
        isAdmin={currentUser.isAdmin}
      />

      <PostDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        post={viewingPost}
        canEdit={viewingPost ? canEditPost(viewingPost) : false}
        onEdit={openEdit}
      />

      <AlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `"${deleteTarget.label}" will be soft-deleted. You can restore it later from the posts list.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDeleteId) {
                  const id = pendingDeleteId;
                  setPendingDeleteId(null);
                  runAction(() => deletePost(id), "Post deleted");
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function PostRow({
  post,
  isAdmin,
  currentUserId,
  pending,
  onView,
  onEdit,
  onPublish,
  onUnpublish,
  onDelete,
  onRestore,
}: {
  post: AdminPost;
  isAdmin: boolean;
  currentUserId: string;
  pending: boolean;
  onView: (post: AdminPost) => void;
  onEdit: (post: AdminPost) => void;
  onPublish: (id: string) => void;
  onUnpublish: (id: string) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
}) {
  const isOwn = post.created_by === currentUserId;
  const canEdit = isAdmin || (isOwn && post.status === "draft");

  // For editors, show Edit greyed-out with the reason instead of hiding it,
  // so it's clear why a non-draft (or someone else's post) can't be edited.
  const editDisabledReason =
    canEdit || post.is_deleted
      ? null
      : isOwn
        ? "Only drafts can be edited"
        : "You can only edit your own posts";

  return (
    <TableRow
      data-deleted={post.is_deleted ? "true" : "false"}
      onClick={() => onView(post)}
      className={cn("cursor-pointer", post.is_deleted && "opacity-50")}
    >
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <span>{post.label}</span>
          {post.is_verified && (
            <CheckCircle2Icon className="size-3.5 text-sky-600 dark:text-sky-400" />
          )}
        </div>
        {post.description && (
          <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {post.description}
          </div>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {post.category?.label ?? "—"}
      </TableCell>
      <TableCell>
        <StatusBadge status={post.status} isDeleted={post.is_deleted} />
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()} className="w-[1%]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={pending}
            >
              <MoreHorizontalIcon className="size-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {canEdit && !post.is_deleted && (
              <DropdownMenuItem onClick={() => onEdit(post)}>
                <PencilIcon className="size-4" />
                Edit
              </DropdownMenuItem>
            )}
            {editDisabledReason && (
              <div title={editDisabledReason} className="cursor-not-allowed">
                <DropdownMenuItem disabled>
                  <PencilIcon className="size-4" />
                  Edit
                </DropdownMenuItem>
              </div>
            )}
            {isAdmin && !post.is_deleted && post.status === "draft" && (
              <DropdownMenuItem onClick={() => onPublish(post.id)}>
                <SendIcon className="size-4" />
                Publish
              </DropdownMenuItem>
            )}
            {isAdmin && !post.is_deleted && post.status === "published" && (
              <DropdownMenuItem onClick={() => onUnpublish(post.id)}>
                <UndoIcon className="size-4" />
                Unpublish
              </DropdownMenuItem>
            )}
            {isAdmin && post.is_deleted && (
              <DropdownMenuItem onClick={() => onRestore(post.id)}>
                <RotateCcwIcon className="size-4" />
                Restore
              </DropdownMenuItem>
            )}
            {isAdmin && !post.is_deleted && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(post.id)}
                >
                  <Trash2Icon className="size-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function StatusBadge({
  status,
  isDeleted,
}: {
  status: "draft" | "published";
  isDeleted: boolean;
}) {
  if (isDeleted) {
    return (
      <Badge variant="outline" className="border-dashed text-muted-foreground">
        Deleted
      </Badge>
    );
  }
  if (status === "published") {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-transparent hover:bg-emerald-100">
        <span className="size-1.5 rounded-full bg-emerald-500 mr-1.5" />
        Published
      </Badge>
    );
  }
  return (
    <Badge
      variant="secondary"
      className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-transparent hover:bg-amber-100"
    >
      <span className="size-1.5 rounded-full bg-amber-500 mr-1.5" />
      Draft
    </Badge>
  );
}

// ---------- Posts filters ----------

function PostFilters({
  search,
  onSearchChange,
  categoryId,
  onCategoryChange,
  categories,
  status,
  onStatusChange,
  tagId,
  onTagChange,
  tags,
  verifiedOnly,
  onVerifiedOnlyChange,
  hasActiveFilters,
  onClear,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  categoryId: string;
  onCategoryChange: (v: string) => void;
  categories: Category[];
  status: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;
  tagId: string;
  onTagChange: (v: string) => void;
  tags: Tag[];
  verifiedOnly: boolean;
  onVerifiedOnlyChange: (v: boolean) => void;
  hasActiveFilters: boolean;
  onClear: () => void;
}) {
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedTag = tags.find((t) => t.id === tagId);

  return (
    <div className="flex flex-wrap items-end gap-3 border-b border-border px-6 py-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="post-search" className="text-xs text-muted-foreground">
          Title
        </Label>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="post-search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search titles…"
            className="w-56 pl-8"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Status</Label>
        <Select
          value={status}
          onValueChange={(v) => v && onStatusChange(v as StatusFilter)}
        >
          <SelectTrigger className="w-36">
            <SelectValue>{STATUS_LABELS[status]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Category</Label>
        <Select
          value={categoryId}
          onValueChange={(v) => v && onCategoryChange(v)}
        >
          <SelectTrigger className="w-44">
            <SelectValue>
              {selectedCategory ? selectedCategory.label : "All categories"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Tag</Label>
        <Select value={tagId} onValueChange={(v) => v && onTagChange(v)}>
          <SelectTrigger className="w-40">
            <SelectValue>
              {selectedTag ? selectedTag.label : "All tags"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All tags</SelectItem>
            {tags.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        variant={verifiedOnly ? "default" : "outline"}
        size="sm"
        aria-pressed={verifiedOnly}
        onClick={() => onVerifiedOnlyChange(!verifiedOnly)}
      >
        <CheckCircle2Icon className="size-4" />
        Verified only
      </Button>

      {hasActiveFilters && (
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          <XIcon className="size-4" />
          Clear
        </Button>
      )}
    </div>
  );
}

function SortableHead({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const isActive = activeKey === sortKey;
  return (
    <TableHead>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-1.5 -ml-1 px-1 py-0.5 rounded hover:text-foreground transition-colors"
      >
        {label}
        {isActive ? (
          dir === "asc" ? (
            <ArrowUpIcon className="size-3.5" />
          ) : (
            <ArrowDownIcon className="size-3.5" />
          )
        ) : (
          <ChevronsUpDownIcon className="size-3.5 text-muted-foreground/60" />
        )}
      </button>
    </TableHead>
  );
}

// ---------- Posts pagination ----------

function PostsPagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min(total, page * pageSize + pageSize);

  return (
    <div className="flex items-center justify-between gap-4 border-t border-border px-6 py-3">
      <p className="text-sm text-muted-foreground tabular-nums">
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground tabular-nums">
          Page {page + 1} of {pageCount}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeftIcon className="size-4" />
          <span className="sr-only">Previous page</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8"
          disabled={page >= pageCount - 1}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRightIcon className="size-4" />
          <span className="sr-only">Next page</span>
        </Button>
      </div>
    </div>
  );
}

// ---------- Users panel ----------

function UsersPanel({
  users,
  currentUserId,
}: {
  users: AdminUser[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("editor");

  function handlePromote(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Enter an email");
      return;
    }
    startTransition(async () => {
      try {
        await promoteUser(email, role);
        toast.success(`${email} promoted to ${role}`);
        setEmail("");
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Something went wrong",
        );
      }
    });
  }

  function handleDemote(userId: string, demoteRole: string, label: string) {
    startTransition(async () => {
      try {
        await demoteUser(userId, demoteRole as Role);
        toast.success(`Removed ${demoteRole} from ${label}`);
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Something went wrong",
        );
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Users with roles</CardTitle>
          <CardDescription>
            Anyone with the admin or editor role appears here.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <EmptyState
              icon={<UsersIcon className="size-8 text-muted-foreground" />}
              title="No users with roles"
              description="Promote a user by email to get started."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead className="w-[1%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.email}
                      {u.id === currentUserId && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (you)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        {u.roles.map((r) => (
                          <Badge
                            key={r}
                            variant={r === "admin" ? "default" : "secondary"}
                            className="capitalize font-normal"
                          >
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            disabled={pending || u.id === currentUserId}
                          >
                            <MoreHorizontalIcon className="size-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          {u.roles.map((r) => (
                            <DropdownMenuItem
                              key={r}
                              variant="destructive"
                              onClick={() => handleDemote(u.id, r, u.email)}
                            >
                              Remove {r}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-1 h-fit">
        <CardHeader>
          <CardTitle>Promote a user</CardTitle>
          <CardDescription>They must already have an account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePromote} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="promote-email">Email</Label>
              <Input
                id="promote-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promote-role">Role</Label>
              <Select
                value={role}
                onValueChange={(v) => v && setRole(v as Role)}
              >
                <SelectTrigger id="promote-role">
                  <SelectValue>
                    {role === "admin" ? "Admin" : "Editor"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Promoting..." : "Promote"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------- Empty state ----------

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
      {icon}
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      {action}
    </div>
  );
}
