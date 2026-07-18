declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

// Wrapper aman: no-op bila fbq belum termuat (ad-blocker, script gagal load).
export const trackPixelEvent = (event: string, params?: Record<string, unknown>) => {
  window.fbq?.("track", event, params);
};
