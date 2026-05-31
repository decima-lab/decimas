import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/logo";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-svh grid md:grid-cols-2">
      <aside className="hidden md:flex flex-col justify-between bg-gray-50 dark:bg-zinc-900 p-12">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3.5" /> Back to site
        </Link>
        <div className="space-y-4">
          <div className="text-2xl font-bold tracking-tight">
            <Logo />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold leading-tight text-gray-900 dark:text-white">
            Your gateway to online earning.
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-300 max-w-md">
            Sign in to manage curated platforms and explore verified ways to
            earn online.
          </p>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          &copy; {new Date().getFullYear()} <Logo />
        </p>
      </aside>
      <section className="flex flex-col justify-center px-6 py-12 md:px-12 lg:px-16">
        <div className="md:hidden mb-8 flex items-center justify-between">
          <div className="text-lg font-bold">
            <Logo />
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="size-3.5" /> Back
          </Link>
        </div>
        <div className="mx-auto w-full max-w-sm">{children}</div>
      </section>
    </main>
  );
}
