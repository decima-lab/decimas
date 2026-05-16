import RootLayout from "./layout";
import { Header, Container, Banner, Card, Footer, Search } from "@/components";

export default function Home() {
  return (
    <RootLayout>
      <Header />
      <Banner />
      <Container>
        <Search />
        <>
          {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i} />
          ))}
        </>
      </Container>
      <Footer />
    </RootLayout>
  );
}
