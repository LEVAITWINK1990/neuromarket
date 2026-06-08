"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCompare, removeFromCompare, clearCompare } from "@/components/compare-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  priceCents: number;
  currency: string;
  productType: string;
  deliveryType: string;
  validityPeriod: string | null;
  refundPolicy: string | null;
  sellerName: string;
  sellerRating: number;
  isVerifiedSeller: boolean;
}

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

export function CompareView() {
  const [ids, setIds] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIds(getCompare());
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (ids.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const res = await fetch(`/api/compare?ids=${ids.join(",")}`);
      const data = await res.json();
      if (!cancelled) {
        setProducts(data.products ?? []);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [ids]);

  function remove(id: string) {
    removeFromCompare(id);
    setIds(getCompare());
  }

  function clearAll() {
    clearCompare();
    setIds([]);
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          You haven&apos;t added any products yet.{" "}
          <Link href="/marketplace" className="text-primary hover:underline">
            Browse marketplace
          </Link>
          .
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="ghost" onClick={clearAll}>
          Clear all
        </Button>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="p-3 text-left w-40">Attribute</th>
              {products.map((p) => (
                <th key={p.id} className="p-3 text-left">
                  <Link href={`/products/${p.slug}`} className="hover:underline font-medium">
                    {p.title}
                  </Link>
                  <button
                    onClick={() => remove(p.id)}
                    className="block text-xs text-muted-foreground hover:text-foreground mt-1"
                  >
                    Remove
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            <Row label="Price" values={products.map((p) => formatPrice(p.priceCents, p.currency))} />
            <Row label="Product type" values={products.map((p) => p.productType.replace(/_/g, " ").toLowerCase())} />
            <Row label="Delivery" values={products.map((p) => p.deliveryType.replace(/_/g, " ").toLowerCase())} />
            <Row label="Validity" values={products.map((p) => p.validityPeriod ?? "—")} />
            <Row label="Refund policy" values={products.map((p) => p.refundPolicy ?? "Per seller")} />
            <Row
              label="Seller"
              values={products.map((p) => (
                <span key={p.id} className="inline-flex items-center gap-1">
                  {p.sellerName}{" "}
                  {p.isVerifiedSeller && <Badge variant="success">verified</Badge>}
                </span>
              ))}
            />
            <Row label="Seller rating" values={products.map((p) => (p.sellerRating > 0 ? `${p.sellerRating.toFixed(1)}★` : "No reviews yet"))} />
            <Row label="Short description" values={products.map((p) => p.shortDescription)} />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ label, values }: { label: string; values: (string | React.ReactNode)[] }) {
  return (
    <tr>
      <td className="p-3 font-medium text-muted-foreground">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="p-3 align-top">
          {v}
        </td>
      ))}
    </tr>
  );
}
