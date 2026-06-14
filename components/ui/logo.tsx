"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

const LOGO_VARIANTS = {
  TEXT: "text",
  LINK: "link",
} as const;

type LogoVariant = (typeof LOGO_VARIANTS)[keyof typeof LOGO_VARIANTS];

interface LogoProps {
  variant?: LogoVariant;
}

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Decimas";

// Light theme logo
function LogoMarkLight() {
  return (
    <Image
      src="/logo-dark.svg"
      alt={appName}
      height={32}
      width={120}
      style={{objectFit: "contain"}}
    />
  );
}

// Dark theme logo
function LogoMarkDark() {
  return (
    <Image
      src="/logo-light.svg"
      alt={appName}
      height={32}
      width={120}
      style={{objectFit: "contain"}}
    />
  );
}

function LogoMark() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check for dark mode preference
    const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(isDarkMode);

    // Listen for theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Avoid hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return isDark ? <LogoMarkDark /> : <LogoMarkLight />;
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
        {/* <LogoWordmark /> */}
      </Link>
    );
  }

  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      {/* <LogoWordmark /> */}
    </span>
  );
}
