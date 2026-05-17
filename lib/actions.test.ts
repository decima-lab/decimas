import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({}),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

const supabaseFrom = vi.fn();

vi.mock("@/utils/supabase/server", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn(),
      signOut: vi.fn(),
      signInWithPassword: vi.fn(),
    },
    from: supabaseFrom,
  }),
}));

vi.mock("@/lib/auth", () => ({
  requireAdmin: vi.fn(),
  requireEditorOrAdmin: vi.fn(),
}));

const { requireAdmin, requireEditorOrAdmin } = await import("./auth");
const {
  createPost,
  updatePost,
  deletePost,
  restorePost,
  publishPost,
  unpublishPost,
  promoteUser,
  demoteUser,
} = await import("./actions");

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------- createPost ----------

describe("createPost", () => {
  it("inserts with created_by from the current user and status=draft", async () => {
    vi.mocked(requireEditorOrAdmin).mockResolvedValue({
      // biome-ignore lint/suspicious/noExplicitAny: test fixture
      user: { id: "user-1" } as any,
      roles: ["editor"],
    });
    const insert = vi.fn().mockResolvedValue({ error: null });
    supabaseFrom.mockReturnValue({ insert });

    await createPost({
      label: "Acme",
      description: "Side hustle",
      link: "https://acme.test",
      categoryId: "cat-1",
    });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "Acme",
        description: "Side hustle",
        link: "https://acme.test",
        category: "cat-1",
        status: "draft",
        created_by: "user-1",
      }),
    );
  });

  it("throws when supabase returns an error", async () => {
    vi.mocked(requireEditorOrAdmin).mockResolvedValue({
      // biome-ignore lint/suspicious/noExplicitAny: test fixture
      user: { id: "u" } as any,
      roles: ["editor"],
    });
    supabaseFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: { message: "db down" } }),
    });
    await expect(createPost({ label: "x" })).rejects.toThrow("db down");
  });
});

// ---------- updatePost ----------

describe("updatePost", () => {
  it("admins skip the ownership check and update directly", async () => {
    vi.mocked(requireEditorOrAdmin).mockResolvedValue({
      // biome-ignore lint/suspicious/noExplicitAny: test fixture
      user: { id: "admin-1" } as any,
      roles: ["admin"],
    });
    const eqUpdate = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq: eqUpdate });
    supabaseFrom.mockReturnValue({ update });

    await updatePost("post-1", { label: "Renamed" });

    expect(update).toHaveBeenCalled();
    expect(eqUpdate).toHaveBeenCalledWith("id", "post-1");
  });

  it("rejects an editor editing another user's post", async () => {
    vi.mocked(requireEditorOrAdmin).mockResolvedValue({
      // biome-ignore lint/suspicious/noExplicitAny: test fixture
      user: { id: "editor-1" } as any,
      roles: ["editor"],
    });
    supabaseFrom.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: { created_by: "other-user", status: "draft" },
              error: null,
            }),
        }),
      }),
    });
    await expect(updatePost("post-1", { label: "x" })).rejects.toThrow(
      /only edit their own posts/,
    );
  });

  it("rejects an editor editing a published post they own", async () => {
    vi.mocked(requireEditorOrAdmin).mockResolvedValue({
      // biome-ignore lint/suspicious/noExplicitAny: test fixture
      user: { id: "editor-1" } as any,
      roles: ["editor"],
    });
    supabaseFrom.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: { created_by: "editor-1", status: "published" },
              error: null,
            }),
        }),
      }),
    });
    await expect(updatePost("post-1", { label: "x" })).rejects.toThrow(
      /only edit drafts/,
    );
  });

  it("allows an editor to update their own draft", async () => {
    vi.mocked(requireEditorOrAdmin).mockResolvedValue({
      // biome-ignore lint/suspicious/noExplicitAny: test fixture
      user: { id: "editor-1" } as any,
      roles: ["editor"],
    });
    supabaseFrom.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: { created_by: "editor-1", status: "draft" },
              error: null,
            }),
        }),
      }),
    });
    const eqUpdate = vi.fn().mockResolvedValue({ error: null });
    supabaseFrom.mockReturnValueOnce({
      update: () => ({ eq: eqUpdate }),
    });

    await updatePost("post-1", { label: "Renamed" });
    expect(eqUpdate).toHaveBeenCalledWith("id", "post-1");
  });

  it("throws when fetching the post fails", async () => {
    vi.mocked(requireEditorOrAdmin).mockResolvedValue({
      // biome-ignore lint/suspicious/noExplicitAny: test fixture
      user: { id: "editor-1" } as any,
      roles: ["editor"],
    });
    supabaseFrom.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          single: () =>
            Promise.resolve({ data: null, error: { message: "x" } }),
        }),
      }),
    });
    await expect(updatePost("post-1", { label: "x" })).rejects.toThrow(
      "Post not found",
    );
  });
});

// ---------- publishPost / unpublishPost / deletePost / restorePost ----------

describe("admin-only post actions", () => {
  function mockAdmin() {
    vi.mocked(requireAdmin).mockResolvedValue({
      // biome-ignore lint/suspicious/noExplicitAny: test fixture
      user: { id: "admin-1" } as any,
      roles: ["admin"],
    });
  }

  function mockUpdateChain() {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    supabaseFrom.mockReturnValue({ update });
    return { update, eq };
  }

  it("publishPost sets status=published", async () => {
    mockAdmin();
    const { update, eq } = mockUpdateChain();
    await publishPost("p1");
    expect(update).toHaveBeenCalledWith({ status: "published" });
    expect(eq).toHaveBeenCalledWith("id", "p1");
  });

  it("unpublishPost sets status=draft", async () => {
    mockAdmin();
    const { update } = mockUpdateChain();
    await unpublishPost("p1");
    expect(update).toHaveBeenCalledWith({ status: "draft" });
  });

  it("deletePost soft-deletes by setting is_deleted=true", async () => {
    mockAdmin();
    const { update } = mockUpdateChain();
    await deletePost("p1");
    expect(update).toHaveBeenCalledWith({ is_deleted: true });
  });

  it("restorePost sets is_deleted=false", async () => {
    mockAdmin();
    const { update } = mockUpdateChain();
    await restorePost("p1");
    expect(update).toHaveBeenCalledWith({ is_deleted: false });
  });
});

// ---------- promoteUser ----------

describe("promoteUser", () => {
  function mockAdmin() {
    vi.mocked(requireAdmin).mockResolvedValue({
      // biome-ignore lint/suspicious/noExplicitAny: test fixture
      user: { id: "admin-1" } as any,
      roles: ["admin"],
    });
  }

  it("rejects an empty email", async () => {
    mockAdmin();
    await expect(promoteUser("   ", "editor")).rejects.toThrow(
      "Email is required",
    );
  });

  function mockProfileLookup(
    profile: { id: string } | null,
    error: unknown = null,
  ) {
    supabaseFrom.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: profile, error }),
        }),
      }),
    });
  }

  it("rejects an unknown email", async () => {
    mockAdmin();
    mockProfileLookup(null);
    await expect(promoteUser("missing@example.com", "editor")).rejects.toThrow(
      /No user found with email/,
    );
  });

  it("throws when the profile lookup errors", async () => {
    mockAdmin();
    mockProfileLookup(null, { message: "db down" });
    await expect(promoteUser("a@b.com", "editor")).rejects.toThrow("db down");
  });

  it("looks up by normalized (lowercase) email and upserts the role", async () => {
    mockAdmin();

    const eqProfile = vi.fn().mockReturnValue({
      maybeSingle: () => Promise.resolve({ data: { id: "u2" }, error: null }),
    });
    supabaseFrom.mockReturnValueOnce({
      select: () => ({ eq: eqProfile }),
    });

    const upsert = vi.fn().mockResolvedValue({ error: null });
    supabaseFrom.mockReturnValueOnce({ upsert });

    await promoteUser("  TARGET@example.com  ", "editor");

    expect(eqProfile).toHaveBeenCalledWith("email", "target@example.com");
    expect(upsert).toHaveBeenCalledWith(
      { user_id: "u2", role: "editor" },
      expect.objectContaining({ onConflict: "user_id,role" }),
    );
  });
});

// ---------- demoteUser ----------

describe("demoteUser", () => {
  it("deletes the specific user_role row", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      // biome-ignore lint/suspicious/noExplicitAny: test fixture
      user: { id: "admin-1" } as any,
      roles: ["admin"],
    });
    const eqRole = vi.fn().mockResolvedValue({ error: null });
    const eqUser = vi.fn().mockReturnValue({ eq: eqRole });
    const del = vi.fn().mockReturnValue({ eq: eqUser });
    supabaseFrom.mockReturnValue({ delete: del });

    await demoteUser("user-2", "editor");

    expect(eqUser).toHaveBeenCalledWith("user_id", "user-2");
    expect(eqRole).toHaveBeenCalledWith("role", "editor");
  });
});
