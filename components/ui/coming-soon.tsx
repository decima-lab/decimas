import { ArrowLeft, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "./badge";
import { buttonVariants } from "./button";

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function ComingSoon({
  icon: Icon,
  title,
  description,
}: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground ring-1 ring-foreground/10">
        <Icon className="size-8" />
      </span>
      <div className="flex flex-col items-center gap-3">
        <Badge variant="secondary">Coming soon</Badge>
        <h1 className="font-heading text-3xl font-bold">{title}</h1>
        <p className="max-w-md text-balance text-muted-foreground">
          {description ?? "This page is under construction. Check back soon."}
        </p>
      </div>
      <Link href="/" className={buttonVariants({ variant: "outline" })}>
        <ArrowLeft />
        Back to home
      </Link>
    </div>
  );
}
