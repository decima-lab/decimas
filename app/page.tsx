import { PostsSearch } from "@/components/posts-search";
import { SiteHeader } from "@/components/site-header";
import { Banner } from "@/components/ui/banner";
import { Container } from "@/components/ui/container";
import { Footer } from "@/components/ui/footer";
import { PostCard } from "@/components/ui/post-card";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <Banner />
      <Container>
        <div className="py-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Explore Opportunities</h2>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Showing 10 platforms
            </span>
          </div>
          <PostsSearch />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 10 }, (_, i) => `card-${i}`).map((id) => (
              <PostCard key={id} />
            ))}
          </div>
        </div>
      </Container>
      <Footer />
    </>
  );
}
