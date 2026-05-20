"use client";

import Logo from "./Logo";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkAuth();
  }, []);

  return (
    <header className="w-full flex items-center justify-between p-4 bg-white dark:bg-black border-b border-gray-200 dark:border-zinc-800">
      <Logo variant={"link"} />
      <nav className="flex items-center gap-6">
        <Link href="#" className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400">
          Browse
        </Link>
        <Link href="#" className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400">
          Categories
        </Link>
        {isLoggedIn ? (
          <Link href="/admin" className="text-sm font-medium px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Admin
          </Link>
        ) : (
          <Link href="/login" className="text-sm font-medium px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Sign In
          </Link>
        )}
      </nav>
    </header>
  );
}
