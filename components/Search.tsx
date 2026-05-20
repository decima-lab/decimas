"use client";

import { Filter, Search as SearchIcon } from "lucide-react";
import { useState } from "react";

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [verified, setVerified] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ searchQuery, category, verified });
  };

  return (
    <form onSubmit={handleSearch} className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <SearchIcon size={20} />
        </div>
        <input
          type="text"
          placeholder="Search platforms by name or keyword..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Filter size={18} />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        {/* Category Filter */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        >
          <option value="all">All Categories</option>
          <option value="surveys">Surveys</option>
          <option value="tasks">Tasks</option>
          <option value="freelance">Freelance</option>
          <option value="investments">Investments</option>
          <option value="other">Other</option>
        </select>

        {/* Verified Only Toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={verified}
            onChange={(e) => setVerified(e.target.checked)}
            className="w-4 h-4 rounded cursor-pointer"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Verified Only
          </span>
        </label>

        {/* Search Button */}
        <button
          type="submit"
          className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 font-medium transition-colors"
        >
          Search
        </button>
      </div>
    </form>
  );
}
