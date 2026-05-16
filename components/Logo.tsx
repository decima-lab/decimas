import Link from "next/link";

const LOGO_VARIANTS = {
  TEXT: "text",
  LINK: "link",
} as const;

type LogoVariant = typeof LOGO_VARIANTS[keyof typeof LOGO_VARIANTS];

interface LogoProps {
  variant?: LogoVariant;
}

const appName = process.env.NEXT_PUBLIC_APP_NAME;

export default function Logo(props: LogoProps) {
  return (
    <>
      {props.variant === LOGO_VARIANTS.LINK ? (
        <span className="text-lg font-bold dark:text-zinc-400">
          <Link href="/">{appName}</Link>
        </span>
      ) : (
        <span>{appName}</span>
      )}
    </>
  );
}
