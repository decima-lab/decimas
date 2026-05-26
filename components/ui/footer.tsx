import Link from "next/link";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <Logo />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Discover the best online earning platforms
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Explore</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link
                  href="#"
                  className="hover:text-blue-600 dark:hover:text-blue-400"
                >
                  All Platforms
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Categories
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Verified Only
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link
                  href="#"
                  className="hover:text-blue-600 dark:hover:text-blue-400"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Blog
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link
                  href="#"
                  className="hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Terms
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-zinc-800 pt-8">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Decimas. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
