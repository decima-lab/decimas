import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function SiteHeader() {
  return (
    <header className="w-full flex items-center justify-between p-4 bg-white dark:bg-black border-b border-gray-200 dark:border-zinc-800">
      <Logo variant={"link"} />
      <nav className="flex items-center gap-6">
        <Link
          href="#"
          className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400"
        >
          Browse
        </Link>
        <Link
          href="#"
          className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400"
        >
          Categories
        </Link>
      </nav>
    </header>
  );
}
