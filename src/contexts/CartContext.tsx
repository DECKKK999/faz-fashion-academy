import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { api, type Cart, type CartItem, type OrderGroup, type ProductType } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const GUEST_KEY = "faz_cart_guest";

// Item tamu hanya menyimpan acuan produk; metadata diisi dari server saat sinkron/login.
type GuestRef = { product_type: ProductType; product_id: string };

type CartContextType = {
  items: CartItem[];
  total_idr: number;
  count: number;
  loading: boolean;
  has: (product_type: ProductType, product_id: string) => boolean;
  add: (product_type: ProductType, product_id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
  checkout: () => Promise<OrderGroup>;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartContextType>({
  items: [],
  total_idr: 0,
  count: 0,
  loading: true,
  has: () => false,
  add: async () => {},
  remove: async () => {},
  clear: async () => {},
  checkout: async () => ({ order_group_id: "", orders: [], total_idr: 0 }),
  refresh: async () => {},
});

export const useCart = () => useContext(CartContext);

function readGuest(): GuestRef[] {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p) => p && (p.product_type === "course" || p.product_type === "ebook" || p.product_type === "event") && typeof p.product_id === "string");
  } catch {
    return [];
  }
}

function writeGuest(refs: GuestRef[]) {
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(refs));
  } catch {
    /* ignore quota */
  }
}

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const mergedFor = useRef<string | null>(null);

  const applyCart = (cart: Cart) => {
    setItems(cart.items);
  };

  // Tamu: bangun tampilan dari localStorage dengan mengambil metadata produk publik.
  const loadGuest = useCallback(async () => {
    const refs = readGuest();
    if (refs.length === 0) {
      setItems([]);
      return;
    }
    const resolved = await Promise.all(
      refs.map(async (ref) => {
        try {
          if (ref.product_type === "course") {
            const c = await api.get<{ id: string; slug: string; title: string; cover_image_url: string | null; price_idr: number }>(`/courses/${ref.product_id}`);
            return { id: ref.product_id, product_type: ref.product_type, product_id: ref.product_id, price_idr: c.price_idr, title_snapshot: c.title, cover_snapshot: c.cover_image_url, slug: c.slug } as CartItem;
          }
          if (ref.product_type === "ebook") {
            const e = await api.get<{ id: string; slug: string; title: string; cover_image_url: string | null; price_idr: number }>(`/ebooks/${ref.product_id}`);
            return { id: ref.product_id, product_type: ref.product_type, product_id: ref.product_id, price_idr: e.price_idr, title_snapshot: e.title, cover_snapshot: e.cover_image_url, slug: e.slug } as CartItem;
          }
          const ev = await api.get<{ id: string; slug: string; title: string; cover_image_url: string | null; price_idr: number; is_free: boolean }>(`/events/${ref.product_id}`);
          return { id: ref.product_id, product_type: ref.product_type, product_id: ref.product_id, price_idr: ev.is_free ? 0 : ev.price_idr, title_snapshot: ev.title, cover_snapshot: ev.cover_image_url, slug: ev.slug } as CartItem;
        } catch {
          return null;
        }
      })
    );
    const valid = resolved.filter((i): i is CartItem => i !== null);
    setItems(valid);
    // Pangkas acuan yang tak valid lagi.
    if (valid.length !== refs.length) {
      writeGuest(valid.map((i) => ({ product_type: i.product_type, product_id: i.product_id })));
    }
  }, []);

  const refresh = useCallback(async () => {
    if (user) {
      const cart = await api.get<Cart>("/cart");
      applyCart(cart);
    } else {
      await loadGuest();
    }
  }, [user, loadGuest]);

  // Gabungkan keranjang tamu ke server tepat setelah login, lalu muat keranjang server.
  useEffect(() => {
    if (authLoading) return;
    let active = true;
    (async () => {
      setLoading(true);
      try {
        if (user) {
          if (mergedFor.current !== user.id) {
            const refs = readGuest();
            if (refs.length > 0) {
              await api.post<Cart>("/cart/merge", { items: refs });
              writeGuest([]);
            }
            mergedFor.current = user.id;
          }
          const cart = await api.get<Cart>("/cart");
          if (active) applyCart(cart);
        } else {
          mergedFor.current = null;
          await loadGuest();
        }
      } catch {
        /* tampilkan keranjang kosong bila gagal */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user, authLoading, loadGuest]);

  const has = useCallback(
    (product_type: ProductType, product_id: string) => items.some((i) => i.product_type === product_type && i.product_id === product_id),
    [items]
  );

  const add = useCallback(
    async (product_type: ProductType, product_id: string) => {
      if (user) {
        const cart = await api.post<Cart>("/cart/items", { product_type, product_id });
        applyCart(cart);
      } else {
        const refs = readGuest();
        if (!refs.some((r) => r.product_type === product_type && r.product_id === product_id)) {
          writeGuest([...refs, { product_type, product_id }]);
        }
        await loadGuest();
      }
    },
    [user, loadGuest]
  );

  const remove = useCallback(
    async (id: string) => {
      if (user) {
        const cart = await api.delete<Cart>(`/cart/items/${id}`);
        applyCart(cart);
      } else {
        // Untuk tamu, id == product_id.
        const refs = readGuest().filter((r) => r.product_id !== id);
        writeGuest(refs);
        await loadGuest();
      }
    },
    [user, loadGuest]
  );

  const clear = useCallback(async () => {
    if (user) {
      const cart = await api.delete<Cart>("/cart");
      applyCart(cart);
    } else {
      writeGuest([]);
      setItems([]);
    }
  }, [user]);

  const checkout = useCallback(async () => {
    const group = await api.post<OrderGroup>("/cart/checkout");
    // Server mengosongkan keranjang; segarkan tampilan lokal.
    setItems([]);
    return group;
  }, []);

  const total_idr = items.reduce((s, i) => s + i.price_idr, 0);

  return (
    <CartContext.Provider value={{ items, total_idr, count: items.length, loading, has, add, remove, clear, checkout, refresh }}>
      {children}
    </CartContext.Provider>
  );
};
