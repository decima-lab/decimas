import { Info } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { ComingSoon } from "@/components/ui/coming-soon";
import { Container } from "@/components/ui/container";
import { Footer } from "@/components/ui/footer";

export default function About() {
  return (
    <>
      <SiteHeader />
      <Container>
        <ComingSoon
          icon={Info}
          title="About"
          description="Learn more about Decimas and our mission to surface the best ways to earn online. More details are on the way."
        />
      </Container>
      <Footer />
    </>
  );
}
