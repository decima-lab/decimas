import { Header, Container, Banner, Card, Footer, Search } from "@/components";

export default function Home() {
  return (
    <>
      <Header />
      <Banner />
      <Container>
        <div className="py-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Explore Opportunities</h2>
            <span className="text-sm text-gray-600 dark:text-gray-400">Showing 10 platforms</span>
          </div>
          <Search />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Card key={i} />
            ))}
          </div>
        </div>
      </Container>
      <Footer />
    </>
  );
}
