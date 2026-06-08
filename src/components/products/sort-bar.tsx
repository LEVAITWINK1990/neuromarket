"use client";

import { ChevronDown } from "lucide-react";

export type SortOption = "popular" | "price_asc" | "price_desc" | "newest" | "name";

interface SortBarProps {
  totalResults: number;
  shownResults: number;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
}

export function SortBar({ totalResults, shownResults, sortBy, onSortChange }: SortBarProps) {
  return (
    <div className="flex items-center justify-between py-3 px-1">
      <p className="text-[13px] text-[#888]">
        Showing <span className="text-white font-medium">{shownResults}</span> of{" "}
        <span className="text-white font-medium">{totalResults}</span> results
      </p>

      <div className="relative">
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="appearance-none rounded-md border border-[#333] bg-[#141414] pl-3 pr-8 py-2 text-[12px] text-[#ccc] outline-none focus:border-[hsl(145,100%,39%)] cursor-pointer"
        >
          <option value="popular">Sort: Popular</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="newest">Newest first</option>
          <option value="name">Name A-Z</option>
        </select>
        <ChevronDown className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[#666] pointer-events-none" />
      </div>
    </div>
  );
}
