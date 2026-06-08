"use client";

import { CATEGORIES } from "@/lib/mock-products";

interface CategoryNavProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryNav({ activeCategory, onCategoryChange }: CategoryNavProps) {
  return (
    <nav className="w-full bg-[#111] border-b border-[#1f1f1f]">
      <div className="mx-auto max-w-[1440px] px-4">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`whitespace-nowrap rounded-md px-3.5 py-2 text-[13px] font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-[hsl(145,100%,39%)]/15 text-[hsl(145,100%,45%)] border border-[hsl(145,100%,39%)]/30"
                  : "text-[#aaa] hover:text-white hover:bg-[#1a1a1a]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
