import { Mail } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "./button";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="bg-muted border-t border-border">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Logo />
            <p className="mt-2 text-sm text-muted-foreground">
              Discover the best online earning opportunities
            </p>
          </div>
          <Link
            href="/contact-us"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            <Mail />
            Contact Us
          </Link>
        </div>
        <div className="border-t border-border mt-8 pt-8">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Decimas. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
