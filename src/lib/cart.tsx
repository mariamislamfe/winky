"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { SITE } from "@/config/site";
import { findProduct, linePrice } from "./catalog";
import type { CartLine, Customization } from "./types";

// v2: customizations are uploaded/typed layers with exact placement
const STORAGE_KEY = "winky.cart.v2";

type State = { lines: CartLine[]; hydrated: boolean };
type Action =
  | { type: "hydrate"; lines: CartLine[] }
  | { type: "add"; line: Omit<CartLine, "id">; id: string }
  | { type: "setQty"; id: string; quantity: number }
  | { type: "remove"; id: string }
  | { type: "clear" };

/** Same product + variant + customization = same line. */
export function lineKey(slug: string, variant?: string, custom?: Customization) {
  return [slug, variant ?? "", custom ? JSON.stringify(custom) : ""].join("|");
}

const clampQty = (q: number) => Math.max(1, Math.min(SITE.maxQuantityPerLine, Math.round(q)));

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { lines: action.lines, hydrated: true };
    case "add": {
      const existing = state.lines.find((l) => l.id === action.id);
      if (existing) {
        return {
          ...state,
          lines: state.lines.map((l) =>
            l.id === action.id ? { ...l, quantity: clampQty(l.quantity + action.line.quantity) } : l,
          ),
        };
      }
      return {
        ...state,
        lines: [...state.lines, { ...action.line, id: action.id, quantity: clampQty(action.line.quantity) }],
      };
    }
    case "setQty":
      return {
        ...state,
        lines: state.lines.map((l) => (l.id === action.id ? { ...l, quantity: clampQty(action.quantity) } : l)),
      };
    case "remove":
      return { ...state, lines: state.lines.filter((l) => l.id !== action.id) };
    case "clear":
      return { ...state, lines: [] };
  }
}

type CartContextValue = {
  lines: CartLine[];
  hydrated: boolean;
  count: number;
  /** Subtotal in minor units; null if any line has no price yet */
  subtotal: number | null;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (line: Omit<CartLine, "id">, opts?: { openDrawer?: boolean }) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  /** Bumps on every add so UI can play a confirmation */
  lastAdded: { id: string; at: number } | null;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { products } = useCatalog();
  const [state, dispatch] = useReducer(reducer, { lines: [], hydrated: false });
  const [isOpen, setOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState<CartContextValue["lastAdded"]>(null);
  const skipFirstSave = useRef(true);

  // Load after mount so server and client render the same empty cart first.
  useEffect(() => {
    let lines: CartLine[] = [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartLine[];
        // Drop lines whose product no longer exists in the catalog
        lines = Array.isArray(parsed)
          ? parsed.filter((l) => l && typeof l.slug === "string" && (!l.custom || Array.isArray(l.custom.layers)))
          : [];
      }
    } catch {
      lines = [];
    }
    dispatch({ type: "hydrate", lines });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lines));
    } catch {
      /* storage unavailable (private mode) — cart still works for this visit */
    }
  }, [state]);

  const add = useCallback<CartContextValue["add"]>((line, opts) => {
    const id = lineKey(line.slug, line.variant, line.custom);
    dispatch({ type: "add", line, id });
    setLastAdded({ id, at: Date.now() });
    if (opts?.openDrawer !== false) setOpen(true);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    // Products removed in the dashboard silently drop out of the bag
    const lines = state.lines.filter((l) => findProduct(products, l.slug));
    const count = lines.reduce((n, l) => n + l.quantity, 0);
    let subtotal: number | null = 0;
    for (const l of lines) {
      const p = linePrice(l, products);
      if (p == null) {
        subtotal = null;
        break;
      }
      subtotal += p * l.quantity;
    }
    return {
      lines,
      hydrated: state.hydrated,
      count,
      subtotal,
      isOpen,
      open: () => setOpen(true),
      close: () => setOpen(false),
      add,
      setQuantity: (id, quantity) => dispatch({ type: "setQty", id, quantity }),
      remove: (id) => dispatch({ type: "remove", id }),
      clear: () => dispatch({ type: "clear" }),
      lastAdded,
    };
  }, [state, isOpen, add, lastAdded, products]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
