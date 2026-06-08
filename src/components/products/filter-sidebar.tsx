"use client";

import { PLATFORMS } from "@/lib/mock-products";

interface FilterSidebarProps {
  selectedPlatforms: string[];
  onPlatformsChange: (platforms: string[]) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
}

export function FilterSidebar({
  selectedPlatforms,
  onPlatformsChange,
  priceRange,
  onPriceRangeChange,
}: FilterSidebarProps) {
  const togglePlatform = (platform: string) => {
    if (selectedPlatforms.includes(platform)) {
      onPlatformsChange(selectedPlatforms.filter((p) => p !== platform));
    } else {
      onPlatformsChange([...selectedPlatforms, platform]);
    }
  };

  return (
    <aside className="w-full lg:w-[240px] flex-shrink-0 space-y-5">
      {/* Platform filter */}
      <div className="rounded-lg bg-[#141414] border border-[#222] p-4">
        <h3 className="text-[13px] font-bold text-white uppercase tracking-wide mb-3">
          Platform
        </h3>
        <div className="space-y-2">
          {PLATFORMS.map((platform) => (
            <label
              key={platform}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={selectedPlatforms.includes(platform)}
                onChange={() => togglePlatform(platform)}
                className="h-3.5 w-3.5 rounded border-[#444] bg-[#1a1a1a] text-[hsl(145,100%,39%)] focus:ring-[hsl(145,100%,39%)] focus:ring-offset-0 accent-[hsl(145,100%,39%)]"
              />
              <span className="text-[13px] text-[#bbb] group-hover:text-white transition-colors">
                {platform}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div className="rounded-lg bg-[#141414] border border-[#222] p-4">
        <h3 className="text-[13px] font-bold text-white uppercase tracking-wide mb-3">
          Price Range
        </h3>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-[#666]">$</span>
            <input
              type="number"
              value={priceRange[0] || ""}
              onChange={(e) => onPriceRangeChange([Number(e.target.value), priceRange[1]])}
              placeholder="Min"
              className="w-full rounded border border-[#333] bg-[#1a1a1a] py-2 pl-5 pr-2 text-[12px] text-white placeholder-[#555] outline-none focus:border-[hsl(145,100%,39%)]"
            />
          </div>
          <span className="text-[#555] text-xs">—</span>
          <div className="relative flex-1">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-[#666]">$</span>
            <input
              type="number"
              value={priceRange[1] || ""}
              onChange={(e) => onPriceRangeChange([priceRange[0], Number(e.target.value)])}
              placeholder="Max"
              className="w-full rounded border border-[#333] bg-[#1a1a1a] py-2 pl-5 pr-2 text-[12px] text-white placeholder-[#555] outline-none focus:border-[hsl(145,100%,39%)]"
            />
          </div>
        </div>
      </div>

      {/* Clear filters */}
      <button
        onClick={() => {
          onPlatformsChange([]);
          onPriceRangeChange([0, 0]);
        }}
        className="w-full rounded-md border border-[#333] bg-transparent py-2 text-[12px] font-medium text-[#999] hover:text-white hover:border-[#555] transition-colors"
      >
        Clear all filters
      </button>
    </aside>
  );
}
