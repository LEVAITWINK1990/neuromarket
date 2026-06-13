"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { buildDeliveredAsset } from "@/lib/catalog-utils";
import { demoProducts, demoUsers } from "@/lib/demo-data";
import type {
  DemoDispute,
  DemoOrder,
  DemoPayout,
  DemoProduct,
  DemoStoreShape,
  DemoUser,
  DemoVerificationRequest,
} from "@/lib/types";

const STORAGE_KEY = "nm-greenfield-store";

const defaultStore: DemoStoreShape = {
  currentUser: null,
  wishlist: [],
  compare: [],
  orders: [],
  disputes: [],
  customProducts: [],
  payouts: [],
  verifications: [],
};

type DemoContextValue = DemoStoreShape & {
  ready: boolean;
  allProducts: DemoProduct[];
  signIn: (email: string, password: string) => { ok: boolean; error?: string };
  signOut: () => void;
  toggleWishlist: (productId: string) => void;
  toggleCompare: (productId: string) => void;
  createOrder: (productId: string) => DemoOrder | null;
  confirmOrder: (orderId: string) => void;
  openDispute: (orderId: string, reason: string) => void;
  createSellerProduct: (input: Omit<DemoProduct, "id" | "status">) => void;
  updateProductStatus: (productId: string, status: DemoProduct["status"]) => void;
  requestPayout: (amount: number, method: string) => void;
  requestVerification: (note: string) => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);

function generateId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function DemoStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoStoreShape>(defaultStore);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      setState({ ...defaultStore, ...JSON.parse(raw) });
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [ready, state]);

  const value = useMemo<DemoContextValue>(() => {
    const allProducts = [...demoProducts, ...state.customProducts];

    return {
      ...state,
      ready,
      allProducts,
      signIn(email, password) {
        const user = demoUsers.find(
          (candidate) =>
            candidate.email.toLowerCase() === email.toLowerCase() &&
            candidate.password === password,
        );

        if (!user) {
          return { ok: false, error: "Неверный email или пароль." };
        }

        if (user.isBanned) {
          return { ok: false, error: "Аккаунт заблокирован." };
        }

        setState((previous) => ({ ...previous, currentUser: user }));
        return { ok: true };
      },
      signOut() {
        setState((previous) => ({ ...previous, currentUser: null }));
      },
      toggleWishlist(productId) {
        setState((previous) => ({
          ...previous,
          wishlist: previous.wishlist.includes(productId)
            ? previous.wishlist.filter((item) => item !== productId)
            : [productId, ...previous.wishlist],
        }));
      },
      toggleCompare(productId) {
        setState((previous) => {
          if (previous.compare.includes(productId)) {
            return {
              ...previous,
              compare: previous.compare.filter((item) => item !== productId),
            };
          }

          return {
            ...previous,
            compare: [productId, ...previous.compare].slice(0, 3),
          };
        });
      },
      createOrder(productId) {
        if (!state.currentUser) {
          return null;
        }

        const product = allProducts.find((item) => item.id === productId);
        if (!product) {
          return null;
        }

        const deliveredAsset = buildDeliveredAsset(product);

        const nextOrder: DemoOrder = {
          id: generateId("order"),
          productId,
          buyerId: state.currentUser.id,
          createdAt: new Date().toISOString(),
          status: product.deliveryType === "MANUAL" ? "PAID" : "DELIVERED",
          total: product.price,
          deliveredAsset,
          deliveryHint:
            product.deliveryType === "MANUAL"
              ? "Manual delivery queued with seller."
              : "Instant digital delivery unlocked.",
        };

        setState((previous) => ({
          ...previous,
          orders: [nextOrder, ...previous.orders],
        }));

        return nextOrder;
      },
      confirmOrder(orderId) {
        setState((previous) => ({
          ...previous,
          orders: previous.orders.map((order) =>
            order.id === orderId ? { ...order, status: "COMPLETED" } : order,
          ),
        }));
      },
      openDispute(orderId, reason) {
        if (!state.currentUser) return;
        const dispute: DemoDispute = {
          id: generateId("dispute"),
          orderId,
          buyerId: state.currentUser.id,
          createdAt: new Date().toISOString(),
          reason,
          status: "OPEN",
        };

        setState((previous) => ({
          ...previous,
          disputes: [dispute, ...previous.disputes],
          orders: previous.orders.map((order) =>
            order.id === orderId ? { ...order, status: "DISPUTED" } : order,
          ),
        }));
      },
      createSellerProduct(input) {
        const product: DemoProduct = {
          ...input,
          id: generateId("product"),
          status: "PENDING_REVIEW",
        };

        setState((previous) => ({
          ...previous,
          customProducts: [product, ...previous.customProducts],
        }));
      },
      updateProductStatus(productId, status) {
        setState((previous) => ({
          ...previous,
          customProducts: previous.customProducts.map((product) =>
            product.id === productId ? { ...product, status } : product,
          ),
        }));
      },
      requestPayout(amount, method) {
        if (!state.currentUser?.sellerId) return;
        const payout: DemoPayout = {
          id: generateId("payout"),
          sellerId: state.currentUser.sellerId,
          amount,
          method,
          status: "REQUESTED",
          createdAt: new Date().toISOString(),
        };
        setState((previous) => ({
          ...previous,
          payouts: [payout, ...previous.payouts],
        }));
      },
      requestVerification(note) {
        if (!state.currentUser?.sellerId) return;
        const verification: DemoVerificationRequest = {
          id: generateId("verify"),
          sellerId: state.currentUser.sellerId,
          note,
          status: "PENDING",
          createdAt: new Date().toISOString(),
        };
        setState((previous) => ({
          ...previous,
          verifications: [verification, ...previous.verifications],
        }));
      },
    };
  }, [ready, state]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemoStore() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemoStore must be used within DemoStoreProvider");
  }
  return context;
}

export function useRequireRole(role: DemoUser["role"]) {
  const store = useDemoStore();
  const allowed = store.currentUser?.role === role;
  return { ...store, allowed };
}
