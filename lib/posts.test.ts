import { describe, expect, it, vi } from "vitest";
import type { AdminPost } from "./posts";
import { getAllPosts } from "./posts";

type Resp = { data: unknown; error: unknown };

function makeSupabase(
  resp: Resp,
  spies?: {
    from?: ReturnType<typeof vi.fn>;
    select?: ReturnType<typeof vi.fn>;
  },
) {
  const innerOrder = () => Promise.resolve(resp);
  const outerOrder = vi.fn().mockReturnValue({ order: innerOrder });
  const select =
    spies?.select ?? vi.fn().mockReturnValue({ order: outerOrder });
  const from = spies?.from ?? vi.fn().mockReturnValue({ select });
  return { from, select, outerOrder } as unknown as {
    from: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    outerOrder: ReturnType<typeof vi.fn>;
  };
}

const samplePost: AdminPost = {
  id: "p1",
  slug: "upwork",
  label: "Upwork",
  description: "Freelance marketplace",
  link: "https://upwork.com",
  logo_url: null,
  is_verified: true,
  is_global: true,
  is_deleted: false,
  effort_level: 2,
  earn_up_to_amount: 500,
  earn_up_to_currency: "USD",
  status: "published",
  created_by: "user-1",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  category: { id: "c1", label: "Freelancing" },
  post_tag_mapping: [
    { tag: { id: "t1", label: "Global", category: "Location" } },
  ],
};

describe("getAllPosts", () => {
  describe("when Supabase returns rows", () => {
    it("returns them as posts", async () => {
      // # GIVEN
      const mock = makeSupabase({ data: [samplePost], error: null });
      // # WHEN
      const result = await getAllPosts({ from: mock.from } as never);
      // # THEN
      expect(result).toEqual([samplePost]);
    });
  });

  describe("when Supabase returns null data", () => {
    it("returns an empty array", async () => {
      // # GIVEN
      const mock = makeSupabase({ data: null, error: null });
      // # WHEN
      const result = await getAllPosts({ from: mock.from } as never);
      // # THEN
      expect(result).toEqual([]);
    });
  });

  describe("when Supabase returns an error", () => {
    it("throws the error message", async () => {
      // # GIVEN
      const mock = makeSupabase({ data: null, error: { message: "boom" } });
      // # WHEN / # THEN
      await expect(getAllPosts({ from: mock.from } as never)).rejects.toThrow(
        "boom",
      );
    });
  });

  describe("when called", () => {
    it("queries the post table", async () => {
      // # GIVEN
      const mock = makeSupabase({ data: [], error: null });
      // # WHEN
      await getAllPosts({ from: mock.from } as never);
      // # THEN
      expect(mock.from).toHaveBeenCalledWith("post");
    });

    it("selects the columns the admin view needs", async () => {
      // # GIVEN
      const mock = makeSupabase({ data: [], error: null });
      // # WHEN
      await getAllPosts({ from: mock.from } as never);
      // # THEN
      const cols = mock.select.mock.calls[0][0] as string;
      for (const col of [
        "status",
        "created_by",
        "is_deleted",
        "category(id, label)",
        "post_tag_mapping(tag(id, label, category))",
      ]) {
        expect(cols).toContain(col);
      }
    });

    it("orders drafts before published, then alphabetically by label", async () => {
      // # GIVEN
      const innerOrder = vi.fn().mockResolvedValue({ data: [], error: null });
      const outerOrder = vi.fn().mockReturnValue({ order: innerOrder });
      const select = vi.fn().mockReturnValue({ order: outerOrder });
      const from = vi.fn().mockReturnValue({ select });
      // # WHEN
      await getAllPosts({ from } as never);
      // # THEN
      expect(outerOrder).toHaveBeenCalledWith("status", { ascending: true });
      expect(innerOrder).toHaveBeenCalledWith("label");
    });
  });
});
