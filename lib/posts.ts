import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminPost = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  link: string | null;
  logo_url: string | null;
  is_verified: boolean;
  is_global: boolean;
  is_deleted: boolean;
  effort_level: number;
  earn_up_to_amount: number;
  earn_up_to_currency: string;
  status: "draft" | "published";
  created_by: string | null;
  created_at: string;
  updated_at: string;
  category: { id: string; label: string } | null;
  post_tag_mapping: {
    tag: { id: string; label: string; category: string | null };
  }[];
};

const POST_COLUMNS =
  "id, slug, label, description, link, logo_url, is_verified, is_global, is_deleted, effort_level, earn_up_to_amount, earn_up_to_currency, status, created_by, created_at, updated_at, category(id, label), post_tag_mapping(tag(id, label, category))";

export async function getAllPosts(
  supabase: SupabaseClient,
): Promise<AdminPost[]> {
  const { data, error } = await supabase
    .from("post")
    .select(POST_COLUMNS)
    .order("status", { ascending: true })
    .order("label");

  if (error) throw new Error(error.message);
  return (data as unknown as AdminPost[]) ?? [];
}

// Default number of posts shown per page on the public landing page.
export const DEFAULT_PAGE_SIZE = 15;

export type PublishedPostsQuery = {
  search?: string;
  categoryId?: string;
  verifiedOnly?: boolean;
  page?: number; // 1-based
  pageSize?: number;
};

export type PublishedPostsPage = {
  posts: AdminPost[];
  total: number;
  page: number;
  pageCount: number;
};

// Narrows any query builder to the public, filterable set: published,
// non-deleted posts, optionally constrained by search/category/verified.
// Shared by the page query and the count-only recovery query below.
// biome-ignore lint/suspicious/noExplicitAny: Supabase's builder type isn't exported in a chainable form
function applyPublishedFilters(builder: any, query: PublishedPostsQuery) {
  builder = builder.eq("status", "published").eq("is_deleted", false);
  const search = query.search?.trim();
  if (search) builder = builder.ilike("label", `%${search}%`);
  if (query.categoryId) builder = builder.eq("category", query.categoryId);
  if (query.verifiedOnly) builder = builder.eq("is_verified", true);
  return builder;
}

// Posts shown on the public landing page: published and not soft-deleted,
// newest first. Filtering (search/category/verified) and pagination are applied
// server-side via `.range()` + an exact count, so the client only ever holds a
// single page of results in memory (lazy loading).
export async function getPublishedPosts(
  supabase: SupabaseClient,
  query: PublishedPostsQuery = {},
): Promise<PublishedPostsPage> {
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
  const page = Math.max(1, query.page ?? 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const builder = applyPublishedFilters(
    supabase.from("post").select(POST_COLUMNS, { count: "exact" }),
    query,
  );

  const { data, error, count } = await builder
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    // PostgREST returns "range not satisfiable" (PGRST103) when the requested
    // page is past the end of the result set — e.g. a stale or hand-edited
    // ?page=. Recover with an empty page rather than 500-ing, but fetch the
    // real count so pagination still lets the user navigate back.
    if (error.code === "PGRST103") {
      const total = await countPublished(supabase, query);
      return {
        posts: [],
        total,
        page,
        pageCount: Math.max(1, Math.ceil(total / pageSize)),
      };
    }
    throw new Error(error.message);
  }

  const total = count ?? 0;
  return {
    posts: (data as unknown as AdminPost[]) ?? [],
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

// Counts the published posts matching `query` without fetching any rows.
async function countPublished(
  supabase: SupabaseClient,
  query: PublishedPostsQuery,
): Promise<number> {
  const { count, error } = await applyPublishedFilters(
    supabase.from("post").select("id", { count: "exact", head: true }),
    query,
  );
  if (error) throw new Error(error.message);
  return count ?? 0;
}
