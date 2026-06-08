import { Mail } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { ComingSoon } from "@/components/ui/coming-soon";
import { Container } from "@/components/ui/container";
import { Footer } from "@/components/ui/footer";

export default function ContactUs() {
  return (
    <>
      <SiteHeader />
      <Container>
        <ComingSoon
          icon={Mail}
          title="Contact Us"
          description="Have a question or want to list your platform? Our contact form is on the way."
        />
      </Container>
      <Footer />
    </>
  );
}
