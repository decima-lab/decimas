import { Newspaper } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { ComingSoon } from "@/components/ui/coming-soon";
import { Container } from "@/components/ui/container";
import { Footer } from "@/components/ui/footer";

export default function Blog() {
  return (
    <>
      <SiteHeader />
      <Container>
        <ComingSoon
          icon={Newspaper}
          title="Blog"
          description="Tips, guides, and updates on the best online earning opportunities. Our first posts are coming soon."
        />
      </Container>
      <Footer />
    </>
  );
}
