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

// "One of ten" mark: ten coins in a ring (decimas = a tenth), with the top one
// lit in the brand accent. Coordinates lifted from design/logos-refined.html.
// The nine coins inherit the text colour (foreground) so the mark flips for
// dark mode; the tenth uses the emerald `--primary`.
const COIN_DOTS: { cx: number; cy: number; accent?: boolean }[] = [
  { cx: 20, cy: 6, accent: true },
  { cx: 28.23, cy: 8.67 },
  { cx: 33.31, cy: 15.67 },
  { cx: 33.31, cy: 24.33 },
  { cx: 28.23, cy: 31.33 },
  { cx: 20, cy: 34 },
  { cx: 11.77, cy: 31.33 },
  { cx: 6.69, cy: 24.33 },
  { cx: 6.69, cy: 15.67 },
  { cx: 11.77, cy: 8.67 },
];

function LogoMark() {
  return (
    <svg
      viewBox="0 0 40 40"
      className="size-8 shrink-0"
      role="img"
      aria-label={appName}
    >
      {COIN_DOTS.map((dot) => (
        <circle
          key={`${dot.cx}-${dot.cy}`}
          cx={dot.cx}
          cy={dot.cy}
          r={2.1}
          className={dot.accent ? "fill-primary" : "fill-foreground"}
        />
      ))}
    </svg>
  );
}

function LogoWordmark() {
  return (
    <span className="-mr-[0.3em] font-heading text-lg font-medium uppercase leading-none tracking-[0.3em]">
      {appName}
    </span>
  );
}

export function Logo(props: LogoProps) {
  if (props.variant === LOGO_VARIANTS.LINK) {
    return (
      <Link
        href="/"
        aria-label={`${appName} home`}
        className="flex items-center gap-2.5"
      >
        <LogoMark />
        <LogoWordmark />
      </Link>
    );
  }

  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <LogoWordmark />
    </span>
  );
}
