import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function SiteHeader() {
  return (
    <header className="w-full flex items-center justify-between p-4 bg-background border-b border-border">
      <Logo variant={"link"} />
      <nav className="flex items-center gap-6">
        <Link
          href="/blog"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Blog
        </Link>
        <Link
          href="/about"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          About
        </Link>
      </nav>
    </header>
  );
}
