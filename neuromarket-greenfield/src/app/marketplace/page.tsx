import { MarketplaceView } from "@/app/marketplace/marketplace-view";

export default function MarketplacePage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    category?: string;
    sort?: string;
    delivery?: string;
  };
}) {
  return (
    <MarketplaceView
      q={searchParams.q}
      category={searchParams.category}
      sort={searchParams.sort}
      delivery={searchParams.delivery}
    />
  );
}
