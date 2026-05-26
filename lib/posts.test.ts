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
  label: "Upwork",
  description: "Freelance marketplace",
  link: "https://upwork.com",
  logo_url: null,
  is_verified: true,
  is_global: true,
  is_deleted: false,
  status: "published",
  created_by: "user-1",
  category: { id: "c1", label: "Freelancing" },
  post_tag_mapping: [{ tag: { id: "t1", label: "Global" } }],
};

describe("getAllPosts", () => {
  it("returns posts when supabase succeeds", async () => {
    const mock = makeSupabase({ data: [samplePost], error: null });
    const result = await getAllPosts({ from: mock.from } as never);
    expect(result).toEqual([samplePost]);
  });

  it("returns an empty array when data is null", async () => {
    const mock = makeSupabase({ data: null, error: null });
    const result = await getAllPosts({ from: mock.from } as never);
    expect(result).toEqual([]);
  });

  it("throws when supabase returns an error", async () => {
    const mock = makeSupabase({ data: null, error: { message: "boom" } });
    await expect(getAllPosts({ from: mock.from } as never)).rejects.toThrow(
      "boom",
    );
  });

  it("queries the post table", async () => {
    const mock = makeSupabase({ data: [], error: null });
    await getAllPosts({ from: mock.from } as never);
    expect(mock.from).toHaveBeenCalledWith("post");
  });

  it("requests the admin-required columns", async () => {
    const mock = makeSupabase({ data: [], error: null });
    await getAllPosts({ from: mock.from } as never);
    const cols = mock.select.mock.calls[0][0] as string;
    for (const col of [
      "status",
      "created_by",
      "is_deleted",
      "category(id, label)",
      "post_tag_mapping(tag(id, label))",
    ]) {
      expect(cols).toContain(col);
    }
  });

  it("orders drafts before published, then alphabetically", async () => {
    const innerOrder = vi.fn().mockResolvedValue({ data: [], error: null });
    const outerOrder = vi.fn().mockReturnValue({ order: innerOrder });
    const select = vi.fn().mockReturnValue({ order: outerOrder });
    const from = vi.fn().mockReturnValue({ select });

    await getAllPosts({ from } as never);
    expect(outerOrder).toHaveBeenCalledWith("status", { ascending: true });
    expect(innerOrder).toHaveBeenCalledWith("label");
  });
});
