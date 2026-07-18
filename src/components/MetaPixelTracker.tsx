import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPixelEvent } from "@/lib/metaPixel";

// Kirim PageView setiap pindah halaman SPA; load pertama sudah
// tercatat oleh snippet pixel di index.html.
const MetaPixelTracker = () => {
  const location = useLocation();
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    trackPixelEvent("PageView");
  }, [location.pathname, location.search]);

  return null;
};

export default MetaPixelTracker;
