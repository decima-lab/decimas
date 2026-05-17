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
  it("returns null user and empty roles when not signed in", async () => {
    setUser(null);
    const result = await getCurrentUserAndRoles();
    expect(result).toEqual({ user: null, roles: [] });
  });

  it("returns user and roles for an authenticated user", async () => {
    setUser({ id: "u1", email: "a@b.com" });
    setRoles(["admin"]);
    const result = await getCurrentUserAndRoles();
    expect(result.user?.id).toBe("u1");
    expect(result.roles).toEqual(["admin"]);
  });

  it("returns multiple roles when present", async () => {
    setUser({ id: "u1" });
    setRoles(["admin", "editor"]);
    const result = await getCurrentUserAndRoles();
    expect(result.roles.sort()).toEqual(["admin", "editor"]);
  });

  it("filters out unrecognised roles", async () => {
    setUser({ id: "u1" });
    setRoles(["admin", "spammer", "editor"]);
    const result = await getCurrentUserAndRoles();
    expect(result.roles.sort()).toEqual(["admin", "editor"]);
  });

  it("returns empty roles when the user has none", async () => {
    setUser({ id: "u1" });
    setRoles([]);
    const result = await getCurrentUserAndRoles();
    expect(result.roles).toEqual([]);
  });
});

describe("requireAdmin", () => {
  it("throws Unauthorized when not signed in", async () => {
    setUser(null);
    await expect(requireAdmin()).rejects.toThrow("Unauthorized");
  });

  it("throws Forbidden when user is not an admin", async () => {
    setUser({ id: "u1" });
    setRoles(["editor"]);
    await expect(requireAdmin()).rejects.toThrow(/admin role required/);
  });

  it("throws Forbidden when user has no roles", async () => {
    setUser({ id: "u1" });
    setRoles([]);
    await expect(requireAdmin()).rejects.toThrow(/admin role required/);
  });

  it("returns user and roles when admin", async () => {
    setUser({ id: "u1", email: "admin@b.com" });
    setRoles(["admin"]);
    const result = await requireAdmin();
    expect(result.user.id).toBe("u1");
    expect(result.roles).toContain("admin");
  });
});

describe("requireEditorOrAdmin", () => {
  it("throws Unauthorized when not signed in", async () => {
    setUser(null);
    await expect(requireEditorOrAdmin()).rejects.toThrow("Unauthorized");
  });

  it("throws Forbidden when user has no relevant role", async () => {
    setUser({ id: "u1" });
    setRoles([]);
    await expect(requireEditorOrAdmin()).rejects.toThrow(
      /editor or admin role required/,
    );
  });

  it("allows admins", async () => {
    setUser({ id: "u1" });
    setRoles(["admin"]);
    const result = await requireEditorOrAdmin();
    expect(result.roles).toContain("admin");
  });

  it("allows editors", async () => {
    setUser({ id: "u1" });
    setRoles(["editor"]);
    const result = await requireEditorOrAdmin();
    expect(result.roles).toContain("editor");
  });
});
