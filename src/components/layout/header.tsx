"use client";

import { Search, ShoppingCart, User, ChevronDown } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function Header({ searchQuery, onSearchChange }: HeaderProps) {
  const [cartCount] = useState(0);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0f0f0f] border-b border-[#1f1f1f] shadow-lg">
      <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-4 py-3">
        {/* Logo */}
        <a href="/" className="flex-shrink-0">
          <span className="text-xl font-bold text-white">
            <span className="text-[hsl(145,100%,39%)]">N</span>euro
            <span className="text-[hsl(145,100%,39%)]">M</span>arket
          </span>
        </a>

        {/* Search */}
        <div className="flex flex-1 max-w-2xl mx-auto">
          <div className="relative w-full flex">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search for AI tools, subscriptions, API credits..."
              className="w-full rounded-l-md border border-[#333] bg-[#1a1a1a] px-4 py-2.5 text-sm text-white placeholder-[#666] outline-none focus:border-[hsl(145,100%,39%)] transition-colors"
            />
            <button className="flex items-center justify-center rounded-r-md bg-[hsl(145,100%,39%)] px-4 hover:bg-[hsl(145,100%,34%)] transition-colors">
              <Search className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* User dropdown */}
          <button className="flex items-center gap-1 rounded-md px-3 py-2 text-sm text-[#ccc] hover:text-white hover:bg-[#1a1a1a] transition-colors">
            <User className="h-4 w-4" />
            <span className="hidden md:inline">Account</span>
            <ChevronDown className="h-3 w-3" />
          </button>

          {/* Cart */}
          <a
            href="/cart"
            className="relative flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-[#ccc] hover:text-white hover:bg-[#1a1a1a] transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden md:inline">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(145,100%,39%)] text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </a>
        </div>
      </div>
    </header>
  );
}
