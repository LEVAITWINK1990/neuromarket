import { CompareView } from "./compare-view";

export const metadata = { title: "Compare products — NeuroMarket" };

export default function ComparePage() {
  return (
    <div className="container py-10 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Compare products</h1>
        <p className="text-sm text-muted-foreground">
          Compare up to 3 products side by side. Add items from any product page using the
          &quot;Compare&quot; button.
        </p>
      </div>
      <CompareView />
    </div>
  );
}
