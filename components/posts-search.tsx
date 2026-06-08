"use client";

import { Filter, Search as SearchIcon } from "lucide-react";
import { useState } from "react";

export function PostsSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [verified, setVerified] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ searchQuery, category, verified });
  };

  return (
    <form onSubmit={handleSearch} className="space-y-4">
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <SearchIcon size={20} />
        </div>
        <input
          type="text"
          placeholder="Search platforms by name or keyword..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-input rounded-lg bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Filter size={18} />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Categories</option>
          <option value="surveys">Surveys</option>
          <option value="tasks">Tasks</option>
          <option value="freelance">Freelance</option>
          <option value="investments">Investments</option>
          <option value="other">Other</option>
        </select>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={verified}
            onChange={(e) => setVerified(e.target.checked)}
            className="w-4 h-4 rounded cursor-pointer accent-primary"
          />
          <span className="text-sm text-foreground">Verified Only</span>
        </label>

        <button
          type="submit"
          className="ml-auto px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition-colors"
        >
          Search
        </button>
      </div>
    </form>
  );
}
