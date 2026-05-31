import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockHeadersGet = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({}),
  headers: vi.fn().mockResolvedValue({ get: mockHeadersGet }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

const supabaseFrom = vi.fn();
const supabaseAuth = {
  getUser: vi.fn(),
  signOut: vi.fn(),
  signInWithPassword: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
};

vi.mock("@/utils/supabase/server", () => ({
  createClient: () => ({
    auth: supabaseAuth,
    from: supabaseFrom,
  }),
}));

vi.mock("@/lib/auth", () => ({
  requireAdmin: vi.fn(),
  requireEditorOrAdmin: vi.fn(),
}));

const { redirect } = await import("next/navigation");
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
  requestPasswordReset,
  resetPassword,
} = await import("./actions");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createPost", () => {
  describe("when an editor creates a post", () => {
    it("inserts a draft owned by the current user", async () => {
      // # GIVEN
      vi.mocked(requireEditorOrAdmin).mockResolvedValue({
        // biome-ignore lint/suspicious/noExplicitAny: test fixture
        user: { id: "user-1" } as any,
        roles: ["editor"],
      });
      const insert = vi.fn().mockResolvedValue({ error: null });
      supabaseFrom.mockReturnValue({ insert });
      // # WHEN
      await createPost({
        label: "Acme",
        description: "Side hustle",
        link: "https://acme.test",
        categoryId: "cat-1",
      });
      // # THEN
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
  });

  describe("when Supabase returns an error on insert", () => {
    it("throws the error message", async () => {
      // # GIVEN
      vi.mocked(requireEditorOrAdmin).mockResolvedValue({
        // biome-ignore lint/suspicious/noExplicitAny: test fixture
        user: { id: "u" } as any,
        roles: ["editor"],
      });
      supabaseFrom.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: { message: "db down" } }),
      });
      // # WHEN / # THEN
      await expect(createPost({ label: "x" })).rejects.toThrow("db down");
    });
  });
});

describe("updatePost", () => {
  describe("when an admin updates any post", () => {
    it("skips the ownership check and updates directly", async () => {
      // # GIVEN
      vi.mocked(requireEditorOrAdmin).mockResolvedValue({
        // biome-ignore lint/suspicious/noExplicitAny: test fixture
        user: { id: "admin-1" } as any,
        roles: ["admin"],
      });
      const eqUpdate = vi.fn().mockResolvedValue({ error: null });
      const update = vi.fn().mockReturnValue({ eq: eqUpdate });
      supabaseFrom.mockReturnValue({ update });
      // # WHEN
      await updatePost("post-1", { label: "Renamed" });
      // # THEN
      expect(update).toHaveBeenCalled();
      expect(eqUpdate).toHaveBeenCalledWith("id", "post-1");
    });
  });

  describe("when an editor tries to update someone else's post", () => {
    it("throws because editors can only edit their own posts", async () => {
      // # GIVEN
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
      // # WHEN / # THEN
      await expect(updatePost("post-1", { label: "x" })).rejects.toThrow(
        /only edit their own posts/,
      );
    });
  });

  describe("when an editor tries to update their own published post", () => {
    it("throws because editors can only edit drafts", async () => {
      // # GIVEN
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
      // # WHEN / # THEN
      await expect(updatePost("post-1", { label: "x" })).rejects.toThrow(
        /only edit drafts/,
      );
    });
  });

  describe("when an editor updates their own draft", () => {
    it("performs the update", async () => {
      // # GIVEN
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
      // # WHEN
      await updatePost("post-1", { label: "Renamed" });
      // # THEN
      expect(eqUpdate).toHaveBeenCalledWith("id", "post-1");
    });
  });

  describe("when the ownership lookup fails", () => {
    it("throws Post not found", async () => {
      // # GIVEN
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
      // # WHEN / # THEN
      await expect(updatePost("post-1", { label: "x" })).rejects.toThrow(
        "Post not found",
      );
    });
  });
});

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

  describe("when an admin publishes a post", () => {
    it("sets status=published on that post", async () => {
      // # GIVEN
      mockAdmin();
      const { update, eq } = mockUpdateChain();
      // # WHEN
      await publishPost("p1");
      // # THEN
      expect(update).toHaveBeenCalledWith({ status: "published" });
      expect(eq).toHaveBeenCalledWith("id", "p1");
    });
  });

  describe("when an admin unpublishes a post", () => {
    it("sets status=draft on that post", async () => {
      // # GIVEN
      mockAdmin();
      const { update } = mockUpdateChain();
      // # WHEN
      await unpublishPost("p1");
      // # THEN
      expect(update).toHaveBeenCalledWith({ status: "draft" });
    });
  });

  describe("when an admin deletes a post", () => {
    it("soft-deletes by setting is_deleted=true", async () => {
      // # GIVEN
      mockAdmin();
      const { update } = mockUpdateChain();
      // # WHEN
      await deletePost("p1");
      // # THEN
      expect(update).toHaveBeenCalledWith({ is_deleted: true });
    });
  });

  describe("when an admin restores a soft-deleted post", () => {
    it("sets is_deleted=false", async () => {
      // # GIVEN
      mockAdmin();
      const { update } = mockUpdateChain();
      // # WHEN
      await restorePost("p1");
      // # THEN
      expect(update).toHaveBeenCalledWith({ is_deleted: false });
    });
  });
});

describe("promoteUser", () => {
  function mockAdmin() {
    vi.mocked(requireAdmin).mockResolvedValue({
      // biome-ignore lint/suspicious/noExplicitAny: test fixture
      user: { id: "admin-1" } as any,
      roles: ["admin"],
    });
  }

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

  describe("when called with a blank email", () => {
    it("throws Email is required", async () => {
      // # GIVEN
      mockAdmin();
      // # WHEN / # THEN
      await expect(promoteUser("   ", "editor")).rejects.toThrow(
        "Email is required",
      );
    });
  });

  describe("when no profile matches the given email", () => {
    it("throws No user found", async () => {
      // # GIVEN
      mockAdmin();
      mockProfileLookup(null);
      // # WHEN / # THEN
      await expect(
        promoteUser("missing@example.com", "editor"),
      ).rejects.toThrow(/No user found with email/);
    });
  });

  describe("when the profile lookup errors", () => {
    it("surfaces the database error", async () => {
      // # GIVEN
      mockAdmin();
      mockProfileLookup(null, { message: "db down" });
      // # WHEN / # THEN
      await expect(promoteUser("a@b.com", "editor")).rejects.toThrow("db down");
    });
  });

  describe("when the email has whitespace and mixed case", () => {
    it("normalises it and upserts the role row", async () => {
      // # GIVEN
      mockAdmin();
      const eqProfile = vi.fn().mockReturnValue({
        maybeSingle: () => Promise.resolve({ data: { id: "u2" }, error: null }),
      });
      supabaseFrom.mockReturnValueOnce({
        select: () => ({ eq: eqProfile }),
      });
      const upsert = vi.fn().mockResolvedValue({ error: null });
      supabaseFrom.mockReturnValueOnce({ upsert });
      // # WHEN
      await promoteUser("  TARGET@example.com  ", "editor");
      // # THEN
      expect(eqProfile).toHaveBeenCalledWith("email", "target@example.com");
      expect(upsert).toHaveBeenCalledWith(
        { user_id: "u2", role: "editor" },
        expect.objectContaining({ onConflict: "user_id,role" }),
      );
    });
  });
});

describe("demoteUser", () => {
  describe("when an admin demotes a user from a specific role", () => {
    it("deletes only the matching user_roles row", async () => {
      // # GIVEN
      vi.mocked(requireAdmin).mockResolvedValue({
        // biome-ignore lint/suspicious/noExplicitAny: test fixture
        user: { id: "admin-1" } as any,
        roles: ["admin"],
      });
      const eqRole = vi.fn().mockResolvedValue({ error: null });
      const eqUser = vi.fn().mockReturnValue({ eq: eqRole });
      const del = vi.fn().mockReturnValue({ eq: eqUser });
      supabaseFrom.mockReturnValue({ delete: del });
      // # WHEN
      await demoteUser("user-2", "editor");
      // # THEN
      expect(eqUser).toHaveBeenCalledWith("user_id", "user-2");
      expect(eqRole).toHaveBeenCalledWith("role", "editor");
    });
  });
});

describe("requestPasswordReset", () => {
  describe("when called with a blank email", () => {
    it("returns an Email is required error", async () => {
      // # GIVEN
      const formData = new FormData();
      formData.set("email", "   ");
      // # WHEN
      const result = await requestPasswordReset(null, formData);
      // # THEN
      expect(result).toEqual({ error: "Email is required" });
      expect(supabaseAuth.resetPasswordForEmail).not.toHaveBeenCalled();
    });
  });

  describe("when called with a valid email", () => {
    it("calls resetPasswordForEmail with the auth callback as redirectTo", async () => {
      // # GIVEN
      mockHeadersGet.mockImplementation((key: string) => {
        if (key === "host") return "example.com";
        if (key === "x-forwarded-proto") return "https";
        return null;
      });
      supabaseAuth.resetPasswordForEmail.mockResolvedValue({ error: null });
      const formData = new FormData();
      formData.set("email", "user@example.com");
      // # WHEN
      const result = await requestPasswordReset(null, formData);
      // # THEN
      expect(supabaseAuth.resetPasswordForEmail).toHaveBeenCalledWith(
        "user@example.com",
        {
          redirectTo: "https://example.com/auth/callback?next=/reset-password",
        },
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe("when Supabase returns an error", () => {
    it("still returns success so the response cannot be used to enumerate emails", async () => {
      // # GIVEN
      mockHeadersGet.mockReturnValue("example.com");
      supabaseAuth.resetPasswordForEmail.mockResolvedValue({
        error: { message: "user not found" },
      });
      const formData = new FormData();
      formData.set("email", "unknown@example.com");
      // # WHEN
      const result = await requestPasswordReset(null, formData);
      // # THEN
      expect(result).toEqual({ success: true });
    });
  });
});

describe("resetPassword", () => {
  describe("when the new password is shorter than 8 characters", () => {
    it("returns a length error and does not call Supabase", async () => {
      // # GIVEN
      const formData = new FormData();
      formData.set("password", "short");
      formData.set("confirmPassword", "short");
      // # WHEN
      const result = await resetPassword(null, formData);
      // # THEN
      expect(result).toEqual({
        error: "Password must be at least 8 characters",
      });
      expect(supabaseAuth.updateUser).not.toHaveBeenCalled();
    });
  });

  describe("when the password and confirmation do not match", () => {
    it("returns a mismatch error and does not call Supabase", async () => {
      // # GIVEN
      const formData = new FormData();
      formData.set("password", "validpass1");
      formData.set("confirmPassword", "differentpass1");
      // # WHEN
      const result = await resetPassword(null, formData);
      // # THEN
      expect(result).toEqual({ error: "Passwords do not match" });
      expect(supabaseAuth.updateUser).not.toHaveBeenCalled();
    });
  });

  describe("when Supabase rejects the new password", () => {
    it("surfaces the Supabase error message", async () => {
      // # GIVEN
      supabaseAuth.updateUser.mockResolvedValue({
        error: { message: "password is too weak" },
      });
      const formData = new FormData();
      formData.set("password", "validpass1");
      formData.set("confirmPassword", "validpass1");
      // # WHEN
      const result = await resetPassword(null, formData);
      // # THEN
      expect(result).toEqual({ error: "password is too weak" });
      expect(supabaseAuth.signOut).not.toHaveBeenCalled();
    });
  });

  describe("when the new password is valid", () => {
    it("updates the password, signs out, and redirects to /login?reset=success", async () => {
      // # GIVEN
      supabaseAuth.updateUser.mockResolvedValue({ error: null });
      supabaseAuth.signOut.mockResolvedValue({ error: null });
      const formData = new FormData();
      formData.set("password", "validpass1");
      formData.set("confirmPassword", "validpass1");
      // # WHEN
      await resetPassword(null, formData);
      // # THEN
      expect(supabaseAuth.updateUser).toHaveBeenCalledWith({
        password: "validpass1",
      });
      expect(supabaseAuth.signOut).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login?reset=success");
    });
  });
});
