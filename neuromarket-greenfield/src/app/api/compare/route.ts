import { NextResponse } from "next/server";

import { demoProducts } from "@/lib/demo-data";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = (searchParams.get("ids") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const products = demoProducts.filter((product) => ids.includes(product.id));

  return NextResponse.json({
    products,
    count: products.length,
  });
}
