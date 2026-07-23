declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

// Wrapper aman: no-op bila fbq belum termuat (ad-blocker, script gagal load).
export const trackPixelEvent = (event: string, params?: Record<string, unknown>) => {
  window.fbq?.("track", event, params);
};

// Purchase hanya boleh terkirim sekali per order — tandai di localStorage supaya
// revisit ke halaman checkout/pesanan yang sama tidak mengirim event dobel
// (dobel Purchase merusak angka revenue & optimasi budget iklan di Meta).
export const trackPurchaseOnce = (orderId: string, params?: Record<string, unknown>) => {
  const key = `fbq_purchase_${orderId}`;
  if (localStorage.getItem(key)) return;
  localStorage.setItem(key, "1");
  trackPixelEvent("Purchase", params);
};
