import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { api, type ProductType, type WishlistItem } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const GUEST_KEY = "faz_wishlist_guest";

type GuestRef = { product_type: ProductType; product_id: string };

type WishlistContextType = {
  items: WishlistItem[];
  count: number;
  loading: boolean;
  has: (product_type: ProductType, product_id: string) => boolean;
  add: (product_type: ProductType, product_id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  toggle: (product_type: ProductType, product_id: string) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
};

const WishlistContext = createContext<WishlistContextType>({
  items: [],
  count: 0,
  loading: true,
  has: () => false,
  add: async () => {},
  remove: async () => {},
  toggle: async () => {},
  clear: async () => {},
  refresh: async () => {},
});

export const useWishlist = () => useContext(WishlistContext);

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

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const mergedFor = useRef<string | null>(null);

  // Tamu: bangun dari localStorage dengan mengambil metadata produk publik.
  const loadGuest = useCallback(async () => {
    const refs = readGuest();
    if (refs.length === 0) {
      setItems([]);
      return;
    }
    const resolved = await Promise.all(
      refs.map(async (ref) => {
        try {
          const path = ref.product_type === "course" ? `/courses/${ref.product_id}` : ref.product_type === "ebook" ? `/ebooks/${ref.product_id}` : `/events/${ref.product_id}`;
          const p = await api.get<{ id: string; slug: string; title: string; cover_image_url: string | null; price_idr: number; is_free?: boolean }>(path);
          return {
            id: ref.product_id,
            product_type: ref.product_type,
            product_id: ref.product_id,
            title: p.title,
            price_idr: ref.product_type === "event" && p.is_free ? 0 : p.price_idr,
            cover_image_url: p.cover_image_url,
            slug: p.slug,
          } as WishlistItem;
        } catch {
          return null;
        }
      })
    );
    const valid = resolved.filter((i): i is WishlistItem => i !== null);
    setItems(valid);
    if (valid.length !== refs.length) {
      writeGuest(valid.map((i) => ({ product_type: i.product_type, product_id: i.product_id })));
    }
  }, []);

  const refresh = useCallback(async () => {
    if (user) {
      setItems(await api.get<WishlistItem[]>("/wishlist"));
    } else {
      await loadGuest();
    }
  }, [user, loadGuest]);

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
              await api.post<WishlistItem[]>("/wishlist/merge", { items: refs });
              writeGuest([]);
            }
            mergedFor.current = user.id;
          }
          const list = await api.get<WishlistItem[]>("/wishlist");
          if (active) setItems(list);
        } else {
          mergedFor.current = null;
          await loadGuest();
        }
      } catch {
        /* abaikan */
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
        setItems(await api.post<WishlistItem[]>("/wishlist/items", { product_type, product_id }));
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
        setItems(await api.delete<WishlistItem[]>(`/wishlist/items/${id}`));
      } else {
        // Untuk tamu, id == product_id.
        writeGuest(readGuest().filter((r) => r.product_id !== id));
        await loadGuest();
      }
    },
    [user, loadGuest]
  );

  const toggle = useCallback(
    async (product_type: ProductType, product_id: string) => {
      const existing = items.find((i) => i.product_type === product_type && i.product_id === product_id);
      if (existing) {
        await remove(existing.id);
      } else {
        await add(product_type, product_id);
      }
    },
    [items, add, remove]
  );

  const clear = useCallback(async () => {
    if (user) {
      // Hapus satu per satu agar tetap sinkron dengan server.
      for (const it of items) {
        try {
          await api.delete<WishlistItem[]>(`/wishlist/items/${it.id}`);
        } catch {
          /* abaikan */
        }
      }
      setItems(await api.get<WishlistItem[]>("/wishlist"));
    } else {
      writeGuest([]);
      setItems([]);
    }
  }, [user, items]);

  return (
    <WishlistContext.Provider value={{ items, count: items.length, loading, has, add, remove, toggle, clear, refresh }}>
      {children}
    </WishlistContext.Provider>
  );
};
