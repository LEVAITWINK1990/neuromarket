"use client";

import { useState, useMemo, useCallback } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { Header } from "@/components/layout/header";
import { CategoryNav } from "@/components/layout/category-nav";
import { FilterSidebar } from "@/components/products/filter-sidebar";
import { SortBar, type SortOption } from "@/components/products/sort-bar";
import { ProductGrid } from "@/components/products/product-grid";
import { mockProducts } from "@/lib/mock-products";
import { Zap, Shield, Clock, Award } from "lucide-react";

const ITEMS_PER_PAGE = 24;

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    const timeout = setTimeout(() => setDebouncedQuery(value), 300);
    return () => clearTimeout(timeout);
  }, []);

  const filteredProducts = useMemo(() => {
    let results = [...mockProducts];

    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      results = results.filter((p) => p.name.toLowerCase().includes(q));
    }

    if (activeCategory !== "All") {
      results = results.filter((p) => p.category === activeCategory);
    }

    if (selectedPlatforms.length > 0) {
      results = results.filter((p) => selectedPlatforms.includes(p.platform));
    }

    if (priceRange[0] > 0) {
      results = results.filter((p) => p.price >= priceRange[0]);
    }
    if (priceRange[1] > 0) {
      results = results.filter((p) => p.price <= priceRange[1]);
    }

    switch (sortBy) {
      case "price_asc":
        results.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        results.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "name":
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return results;
  }, [debouncedQuery, activeCategory, selectedPlatforms, priceRange, sortBy]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  return (
    <>
      <TopBar />
      <Header searchQuery={searchQuery} onSearchChange={handleSearchChange} />
      <CategoryNav activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

      {/* Hero Banner */}
      <section className="w-full bg-gradient-to-r from-[#0a1a0f] via-[#0f1f14] to-[#0a0f0a] border-b border-[#1a2a1f]">
        <div className="mx-auto max-w-[1440px] px-4 py-10 md:py-14">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-[hsl(145,100%,39%)]/10 border border-[hsl(145,100%,39%)]/20 px-3 py-1">
                <Zap className="h-3.5 w-3.5 text-[hsl(145,100%,45%)]" />
                <span className="text-[12px] font-medium text-[hsl(145,100%,45%)]">
                  Instant Delivery
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                AI Tools & Subscriptions
                <br />
                <span className="text-[hsl(145,100%,39%)]">at the Best Price</span>
              </h1>
              <p className="text-[15px] text-[#999] max-w-md leading-relaxed">
                Get legitimate ChatGPT, Claude, Midjourney, and 50+ AI tool subscriptions from verified sellers. Save up to 30% on every purchase.
              </p>
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="flex items-center gap-2 text-[12px] text-[#888]">
                  <Shield className="h-4 w-4 text-[hsl(145,100%,39%)]" />
                  Buyer Protection
                </div>
                <div className="flex items-center gap-2 text-[12px] text-[#888]">
                  <Clock className="h-4 w-4 text-[hsl(145,100%,39%)]" />
                  24/7 Support
                </div>
                <div className="flex items-center gap-2 text-[12px] text-[#888]">
                  <Award className="h-4 w-4 text-[hsl(145,100%,39%)]" />
                  Verified Sellers
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center justify-center w-[320px] h-[200px] rounded-xl bg-gradient-to-br from-[hsl(145,100%,39%)]/10 to-transparent border border-[hsl(145,100%,39%)]/10">
              <div className="text-center">
                <div className="text-5xl font-black text-[hsl(145,100%,39%)]">-30%</div>
                <div className="text-[13px] text-[#888] mt-1">Average savings</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-[1440px] px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar filters */}
          <FilterSidebar
            selectedPlatforms={selectedPlatforms}
            onPlatformsChange={setSelectedPlatforms}
            priceRange={priceRange}
            onPriceRangeChange={setPriceRange}
          />

          {/* Main product area */}
          <div className="flex-1 min-w-0">
            <SortBar
              totalResults={filteredProducts.length}
              shownResults={visibleProducts.length}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />

            <ProductGrid products={visibleProducts} />

            {/* Load more */}
            {hasMore && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
                  className="rounded-md bg-[#1a1a1a] border border-[#333] px-8 py-2.5 text-[13px] font-medium text-[#ccc] hover:bg-[#222] hover:border-[hsl(145,100%,39%)]/40 hover:text-white transition-all"
                >
                  Load more products
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t border-[#1a1a1a] bg-[#0a0a0a]">
        <div className="mx-auto max-w-[1440px] px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-[13px] font-bold text-white uppercase tracking-wide mb-3">Marketplace</h4>
              <ul className="space-y-2 text-[12px] text-[#777]">
                <li><a href="/marketplace" className="hover:text-white transition-colors">All Products</a></li>
                <li><a href="/categories" className="hover:text-white transition-colors">Categories</a></li>
                <li><a href="/sellers" className="hover:text-white transition-colors">Top Sellers</a></li>
                <li><a href="/marketplace?sort=newest" className="hover:text-white transition-colors">New Arrivals</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[13px] font-bold text-white uppercase tracking-wide mb-3">For Sellers</h4>
              <ul className="space-y-2 text-[12px] text-[#777]">
                <li><a href="/sign-up" className="hover:text-white transition-colors">Start Selling</a></li>
                <li><a href="/seller" className="hover:text-white transition-colors">Seller Dashboard</a></li>
                <li><a href="/seller/verification" className="hover:text-white transition-colors">Get Verified</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[13px] font-bold text-white uppercase tracking-wide mb-3">Help</h4>
              <ul className="space-y-2 text-[12px] text-[#777]">
                <li><a href="/trust-and-safety" className="hover:text-white transition-colors">Trust & Safety</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[13px] font-bold text-white uppercase tracking-wide mb-3">Legal</h4>
              <ul className="space-y-2 text-[12px] text-[#777]">
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-[#1a1a1a] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[12px] text-[#555]">
              &copy; 2026 NeuroMarket. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-[11px] text-[#555]">
              <span>Visa</span>
              <span>Mastercard</span>
              <span>YooKassa</span>
              <span>Crypto</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
