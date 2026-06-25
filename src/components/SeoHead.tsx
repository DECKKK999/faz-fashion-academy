import { useEffect } from "react";

type SeoHeadProps = {
  title: string;
  description?: string;
  image?: string;
};

const SITE_NAME = "FAZ Academy";

// Atur <title> + meta description / Open Graph via DOM (tanpa dependensi tambahan).
// Mengembalikan nilai semula saat unmount agar tidak "bocor" antar halaman.
const SeoHead = ({ title, description, image }: SeoHeadProps) => {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
    const prevTitle = document.title;
    document.title = fullTitle;

    // Helper: ambil/buat tag meta, kembalikan fungsi pemulih nilai sebelumnya.
    const restorers: Array<() => void> = [];

    const setMeta = (selector: string, attr: "name" | "property", key: string, value: string | undefined) => {
      if (value == null) return;
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      let created = false;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
        created = true;
      }
      const prev = el.getAttribute("content");
      el.setAttribute("content", value);
      restorers.push(() => {
        if (created) {
          el?.remove();
        } else if (prev != null) {
          el?.setAttribute("content", prev);
        }
      });
    };

    if (description) {
      setMeta('meta[name="description"]', "name", "description", description);
      setMeta('meta[property="og:description"]', "property", "og:description", description);
    }
    setMeta('meta[property="og:title"]', "property", "og:title", fullTitle);
    setMeta('meta[property="og:type"]', "property", "og:type", "website");
    setMeta('meta[property="og:site_name"]', "property", "og:site_name", SITE_NAME);
    if (image) {
      setMeta('meta[property="og:image"]', "property", "og:image", image);
      setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
      setMeta('meta[name="twitter:image"]', "name", "twitter:image", image);
    }

    return () => {
      document.title = prevTitle;
      // Pulihkan dari belakang agar urutan create/remove konsisten.
      for (let i = restorers.length - 1; i >= 0; i--) restorers[i]();
    };
  }, [title, description, image]);

  return null;
};

export default SeoHead;
