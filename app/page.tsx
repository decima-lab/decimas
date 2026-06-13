import { cookies } from "next/headers";
import { type PostListItem, PostsList } from "@/components/posts-list";
import { SiteHeader } from "@/components/site-header";
import { Banner } from "@/components/ui/banner";
import { Container } from "@/components/ui/container";
import { Footer } from "@/components/ui/footer";
import { DEFAULT_PAGE_SIZE, getPublishedPosts } from "@/lib/posts";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type HomeSearchParams = {
  q?: string;
  category?: string;
  verified?: string;
  page?: string;
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<HomeSearchParams>;
}) {
  const sp = await searchParams;
  const supabase = createClient(await cookies());

  const search = sp.q?.trim() ?? "";
  const categoryId = sp.category ?? "";
  const verifiedOnly = sp.verified === "1";
  const page = Math.max(1, Number(sp.page) || 1);
  const hasFilters = search !== "" || categoryId !== "" || verifiedOnly;

  const [result, { data: categoryRows }] = await Promise.all([
    getPublishedPosts(supabase, {
      search,
      categoryId: categoryId || undefined,
      verifiedOnly,
      page,
      pageSize: DEFAULT_PAGE_SIZE,
    }),
    supabase.from("category").select("id, label").order("label"),
  ]);

  const posts: PostListItem[] = result.posts.map((post) => ({
    id: post.id,
    label: post.label,
    category: post.category?.label ?? null,
    description: post.description,
    link: post.link,
    logoUrl: post.logo_url,
    tags: post.post_tag_mapping.map((m) => m.tag.label),
    isVerified: post.is_verified,
    isGlobal: post.is_global,
    effortLevel: post.effort_level,
    earnUpToAmount: post.earn_up_to_amount,
    earnUpToCurrency: post.earn_up_to_currency,
    createdAt: post.created_at,
  }));

  const categories = (categoryRows ?? []) as { id: string; label: string }[];

  return (
    <>
      <SiteHeader />
      <Banner />
      <Container>
        <div className="space-y-6">
          {result.total === 0 && !hasFilters ? (
            <>
              <h2 className="text-2xl font-bold">Explore Opportunities</h2>
              <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
                No posts published yet
              </div>
            </>
          ) : (
            <PostsList
              posts={posts}
              categories={categories}
              total={result.total}
              page={result.page}
              pageCount={result.pageCount}
            />
          )}
        </div>
      </Container>
      <Footer />
    </>
  );
}
