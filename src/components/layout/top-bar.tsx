"use client";

import { Globe, ChevronDown } from "lucide-react";

export function TopBar() {
  return (
    <div className="w-full bg-[#0a0a0a] border-b border-[#1a1a1a]">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-1.5 text-[12px] text-[#999]">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1 hover:text-white transition-colors">
            <Globe className="h-3 w-3" />
            <span>English</span>
            <ChevronDown className="h-3 w-3" />
          </button>
          <button className="flex items-center gap-1 hover:text-white transition-colors">
            <span>USD ($)</span>
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <a href="/sign-in" className="hover:text-white transition-colors">
            Log in
          </a>
          <a href="/sign-up" className="hover:text-white transition-colors">
            Register
          </a>
        </div>
      </div>
    </div>
  );
}
