import { cookies } from "next/headers";
import { type PostListItem, PostsList } from "@/components/posts-list";
import { PostsSearch } from "@/components/posts-search";
import { SiteHeader } from "@/components/site-header";
import { Banner } from "@/components/ui/banner";
import { Container } from "@/components/ui/container";
import { Footer } from "@/components/ui/footer";
import { getPublishedPosts } from "@/lib/posts";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createClient(await cookies());
  const rows = await getPublishedPosts(supabase);

  const posts: PostListItem[] = rows.map((post) => ({
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

  return (
    <>
      <SiteHeader />
      <Banner />
      <Container>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Explore Opportunities</h2>
            <span className="text-sm text-muted-foreground">
              {posts.length === 1
                ? "Showing 1 platform"
                : `Showing ${posts.length} platforms`}
            </span>
          </div>
          <PostsSearch />
          {posts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
              No posts published yet
            </div>
          ) : (
            <PostsList posts={posts} />
          )}
        </div>
      </Container>
      <Footer />
    </>
  );
}
