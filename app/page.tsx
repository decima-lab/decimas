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
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Explore Opportunities</h2>
            <span className="text-sm text-muted-foreground">
              Showing 10 platforms
            </span>
          </div>
          <PostsSearch />
          <div className="grid gap-4">
            {Array.from({ length: 10 }, (_, i) => `card-${i}`).map((id) => (
              <PostCard
                key={id}
                label="Earning Platform"
                category="Surveys & Rewards"
                description="Start earning money online with this verified platform. Complete tasks, surveys, and other activities to grow your income."
                link="https://example.com"
                logoUrl="https://picsum.photos/64/64?random"
                tags={[
                  "Beginner Friendly",
                  "PayPal",
                  "Free to Join",
                  "Weekly",
                  "Mobile App",
                  "Side Income",
                ]}
                isVerified
                isGlobal
                createdAt="2023-01-01"
              />
            ))}
          </div>
        </div>
      </Container>
      <Footer />
    </>
  );
}
