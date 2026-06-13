import { describe, expect, it, vi } from "vitest";
import type { AdminPost } from "./posts";
import { getAllPosts, getPublishedPosts } from "./posts";

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

type CountResp = { data: unknown; error: unknown; count?: number | null };

// The published query chains select→eq→eq→(ilike?)→(eq?)→order→range and reads
// `{ data, error, count }` off the awaited range() call. A single chainable
// builder (every method returns itself) lets tests assert on any link.
function makePublishedSupabase(resp: CountResp) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    ilike: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
  };
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.ilike.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  builder.range.mockResolvedValue(resp);
  const from = vi.fn().mockReturnValue(builder);
  return { from, builder };
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

describe("getPublishedPosts", () => {
  describe("when Supabase returns rows", () => {
    it("returns them with the total count and page count", async () => {
      // # GIVEN
      const mock = makePublishedSupabase({
        data: [samplePost],
        error: null,
        count: 1,
      });
      // # WHEN
      const result = await getPublishedPosts({ from: mock.from } as never);
      // # THEN
      expect(result.posts).toEqual([samplePost]);
      expect(result.total).toBe(1);
      expect(result.pageCount).toBe(1);
    });
  });

  describe("when Supabase returns null data", () => {
    it("returns an empty page", async () => {
      // # GIVEN
      const mock = makePublishedSupabase({ data: null, error: null, count: 0 });
      // # WHEN
      const result = await getPublishedPosts({ from: mock.from } as never);
      // # THEN
      expect(result.posts).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe("when Supabase returns an error", () => {
    it("throws the error message", async () => {
      // # GIVEN
      const mock = makePublishedSupabase({
        data: null,
        error: { message: "boom" },
        count: null,
      });
      // # WHEN / # THEN
      await expect(
        getPublishedPosts({ from: mock.from } as never),
      ).rejects.toThrow("boom");
    });
  });

  describe("when called with no query", () => {
    it("filters to published, non-deleted posts, newest first, page one", async () => {
      // # GIVEN
      const mock = makePublishedSupabase({ data: [], error: null, count: 0 });
      // # WHEN
      await getPublishedPosts({ from: mock.from } as never);
      // # THEN
      expect(mock.builder.eq).toHaveBeenCalledWith("status", "published");
      expect(mock.builder.eq).toHaveBeenCalledWith("is_deleted", false);
      expect(mock.builder.order).toHaveBeenCalledWith("created_at", {
        ascending: false,
      });
      expect(mock.builder.range).toHaveBeenCalledWith(0, 14);
    });
  });

  describe("when given a page beyond the first", () => {
    it("requests the matching range", async () => {
      // # GIVEN
      const mock = makePublishedSupabase({ data: [], error: null, count: 100 });
      // # WHEN
      await getPublishedPosts({ from: mock.from } as never, {
        page: 3,
        pageSize: 15,
      });
      // # THEN
      expect(mock.builder.range).toHaveBeenCalledWith(30, 44);
    });
  });

  describe("when given a search term", () => {
    it("filters by label, trimming surrounding whitespace", async () => {
      // # GIVEN
      const mock = makePublishedSupabase({ data: [], error: null, count: 0 });
      // # WHEN
      await getPublishedPosts({ from: mock.from } as never, {
        search: "  upwork ",
      });
      // # THEN
      expect(mock.builder.ilike).toHaveBeenCalledWith("label", "%upwork%");
    });
  });

  describe("when given a category and verified filter", () => {
    it("constrains the query by both", async () => {
      // # GIVEN
      const mock = makePublishedSupabase({ data: [], error: null, count: 0 });
      // # WHEN
      await getPublishedPosts({ from: mock.from } as never, {
        categoryId: "c1",
        verifiedOnly: true,
      });
      // # THEN
      expect(mock.builder.eq).toHaveBeenCalledWith("category", "c1");
      expect(mock.builder.eq).toHaveBeenCalledWith("is_verified", true);
    });
  });

  describe("when the requested page is past the end of the results", () => {
    it("returns an empty page with the real total instead of throwing", async () => {
      // # GIVEN
      // The data query (first from()) hits PostgREST's range error; the
      // count-only recovery query (second from()) resolves to the true total.
      const dataBuilder = {
        select: vi.fn(),
        eq: vi.fn(),
        ilike: vi.fn(),
        order: vi.fn(),
        range: vi.fn(),
      };
      dataBuilder.select.mockReturnValue(dataBuilder);
      dataBuilder.eq.mockReturnValue(dataBuilder);
      dataBuilder.ilike.mockReturnValue(dataBuilder);
      dataBuilder.order.mockReturnValue(dataBuilder);
      dataBuilder.range.mockResolvedValue({
        data: null,
        error: { code: "PGRST103", message: "Requested range not satisfiable" },
        count: null,
      });

      const countBuilder = {
        select: vi.fn(),
        eq: vi.fn(),
        ilike: vi.fn(),
        // Awaiting the builder resolves the head-count query.
        // biome-ignore lint/suspicious/noThenProperty: a thenable mock is exactly what we need here
        then: (resolve: (v: { count: number; error: null }) => void) =>
          resolve({ count: 1, error: null }),
      };
      countBuilder.select.mockReturnValue(countBuilder);
      countBuilder.eq.mockReturnValue(countBuilder);
      countBuilder.ilike.mockReturnValue(countBuilder);

      const from = vi
        .fn()
        .mockReturnValueOnce(dataBuilder)
        .mockReturnValueOnce(countBuilder);

      // # WHEN
      const result = await getPublishedPosts({ from } as never, { page: 5 });

      // # THEN
      expect(result.posts).toEqual([]);
      expect(result.total).toBe(1);
      expect(result.page).toBe(5);
      expect(result.pageCount).toBe(1);
    });
  });

  describe("when the count spans multiple pages", () => {
    it("reports the page count for the given page size", async () => {
      // # GIVEN
      const mock = makePublishedSupabase({ data: [], error: null, count: 31 });
      // # WHEN
      const result = await getPublishedPosts({ from: mock.from } as never, {
        pageSize: 15,
      });
      // # THEN
      expect(result.pageCount).toBe(3);
    });
  });
});
