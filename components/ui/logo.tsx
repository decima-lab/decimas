import { CircleDollarSign } from "lucide-react";
import Link from "next/link";

const LOGO_VARIANTS = {
  TEXT: "text",
  LINK: "link",
} as const;

type LogoVariant = (typeof LOGO_VARIANTS)[keyof typeof LOGO_VARIANTS];

interface LogoProps {
  variant?: LogoVariant;
}

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Decimas";

function LogoMark() {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
      <CircleDollarSign className="size-5" />
    </span>
  );
}

export function Logo(props: LogoProps) {
  if (props.variant === LOGO_VARIANTS.LINK) {
    return (
      <Link
        href="/"
        aria-label={`${appName} home`}
        className="flex items-center gap-2"
      >
        <LogoMark />
        <span className="font-heading text-lg font-bold">{appName}</span>
      </Link>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <LogoMark />
      <span className="font-heading text-lg font-bold">{appName}</span>
    </span>
  );
}
