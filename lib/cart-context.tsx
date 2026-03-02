"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { cart as cartApi, type Cart, type CartItem } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type CartContextType = {
  cart: Cart | null;
  items: CartItem[];
  count: number;
  loading: boolean;
  addItem: (productId: number, quantity?: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setCart(null);
      return;
    }
    try {
      setLoading(true);
      const c = await cartApi.get();
      setCart(c);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Charger le panier quand l'utilisateur se connecte
  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = async (productId: number, quantity = 1) => {
    const updated = await cartApi.addItem(productId, quantity);
    setCart(updated);
  };

  const updateItem = async (itemId: number, quantity: number) => {
    const updated = await cartApi.updateItem(itemId, quantity);
    setCart(updated);
  };

  const removeItem = async (itemId: number) => {
    const updated = await cartApi.removeItem(itemId);
    setCart(updated);
  };

  const clear = async () => {
    const updated = await cartApi.clear();
    setCart(updated);
  };

  const items = cart?.items ?? [];
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cart, items, count, loading, addItem, updateItem, removeItem, clear, refresh }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
