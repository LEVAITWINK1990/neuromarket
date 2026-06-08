// Simple client-side comparison store using localStorage.

const KEY = "nm:compare";

export function getCompare(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function addToCompare(productId: string) {
  if (typeof window === "undefined") return;
  const cur = getCompare().filter((id) => id !== productId);
  cur.unshift(productId);
  window.localStorage.setItem(KEY, JSON.stringify(cur.slice(0, 3)));
}

export function clearCompare() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify([]));
}

export function removeFromCompare(productId: string) {
  if (typeof window === "undefined") return;
  const cur = getCompare().filter((id) => id !== productId);
  window.localStorage.setItem(KEY, JSON.stringify(cur));
}
