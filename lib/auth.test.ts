import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

const { getCurrentUserAndRoles, requireAdmin, requireEditorOrAdmin } =
  await import("./auth");

function setUser(user: { id: string; email?: string } | null) {
  mockGetUser.mockResolvedValue({ data: { user } });
}

function setRoles(roles: string[]) {
  mockFrom.mockReturnValue({
    select: () => ({
      eq: () =>
        Promise.resolve({ data: roles.map((r) => ({ role: r })), error: null }),
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getCurrentUserAndRoles", () => {
  describe("when no one is signed in", () => {
    it("returns a null user and empty roles", async () => {
      // # GIVEN
      setUser(null);
      // # WHEN
      const result = await getCurrentUserAndRoles();
      // # THEN
      expect(result).toEqual({ user: null, roles: [] });
    });
  });

  describe("when an admin is signed in", () => {
    it("returns the user and their role", async () => {
      // # GIVEN
      setUser({ id: "u1", email: "a@b.com" });
      setRoles(["admin"]);
      // # WHEN
      const result = await getCurrentUserAndRoles();
      // # THEN
      expect(result.user?.id).toBe("u1");
      expect(result.roles).toEqual(["admin"]);
    });
  });

  describe("when a user has both admin and editor roles", () => {
    it("returns both roles", async () => {
      // # GIVEN
      setUser({ id: "u1" });
      setRoles(["admin", "editor"]);
      // # WHEN
      const result = await getCurrentUserAndRoles();
      // # THEN
      expect(result.roles.sort()).toEqual(["admin", "editor"]);
    });
  });

  describe("when the database holds unknown role names", () => {
    it("filters them out and returns only recognised roles", async () => {
      // # GIVEN
      setUser({ id: "u1" });
      setRoles(["admin", "spammer", "editor"]);
      // # WHEN
      const result = await getCurrentUserAndRoles();
      // # THEN
      expect(result.roles.sort()).toEqual(["admin", "editor"]);
    });
  });

  describe("when a signed-in user has no role rows", () => {
    it("returns empty roles", async () => {
      // # GIVEN
      setUser({ id: "u1" });
      setRoles([]);
      // # WHEN
      const result = await getCurrentUserAndRoles();
      // # THEN
      expect(result.roles).toEqual([]);
    });
  });
});

describe("requireAdmin", () => {
  describe("when no one is signed in", () => {
    it("throws Unauthorized", async () => {
      // # GIVEN
      setUser(null);
      // # WHEN / # THEN
      await expect(requireAdmin()).rejects.toThrow("Unauthorized");
    });
  });

  describe("when a signed-in user only has the editor role", () => {
    it("throws Forbidden", async () => {
      // # GIVEN
      setUser({ id: "u1" });
      setRoles(["editor"]);
      // # WHEN / # THEN
      await expect(requireAdmin()).rejects.toThrow(/admin role required/);
    });
  });

  describe("when a signed-in user has no roles at all", () => {
    it("throws Forbidden", async () => {
      // # GIVEN
      setUser({ id: "u1" });
      setRoles([]);
      // # WHEN / # THEN
      await expect(requireAdmin()).rejects.toThrow(/admin role required/);
    });
  });

  describe("when an admin is signed in", () => {
    it("returns the user and their roles", async () => {
      // # GIVEN
      setUser({ id: "u1", email: "admin@b.com" });
      setRoles(["admin"]);
      // # WHEN
      const result = await requireAdmin();
      // # THEN
      expect(result.user.id).toBe("u1");
      expect(result.roles).toContain("admin");
    });
  });
});

describe("requireEditorOrAdmin", () => {
  describe("when no one is signed in", () => {
    it("throws Unauthorized", async () => {
      // # GIVEN
      setUser(null);
      // # WHEN / # THEN
      await expect(requireEditorOrAdmin()).rejects.toThrow("Unauthorized");
    });
  });

  describe("when a signed-in user has neither editor nor admin role", () => {
    it("throws Forbidden", async () => {
      // # GIVEN
      setUser({ id: "u1" });
      setRoles([]);
      // # WHEN / # THEN
      await expect(requireEditorOrAdmin()).rejects.toThrow(
        /editor or admin role required/,
      );
    });
  });

  describe("when an admin is signed in", () => {
    it("allows access", async () => {
      // # GIVEN
      setUser({ id: "u1" });
      setRoles(["admin"]);
      // # WHEN
      const result = await requireEditorOrAdmin();
      // # THEN
      expect(result.roles).toContain("admin");
    });
  });

  describe("when an editor is signed in", () => {
    it("allows access", async () => {
      // # GIVEN
      setUser({ id: "u1" });
      setRoles(["editor"]);
      // # WHEN
      const result = await requireEditorOrAdmin();
      // # THEN
      expect(result.roles).toContain("editor");
    });
  });
});
