/**
 * Subtle film-grain texture for the dark customer-facing app. Mounted
 * per-page (not globally in App.tsx) so the Admin panel — opted out of this
 * redesign via .admin-scope — never picks it up.
 */
const GrainOverlay = () => (
  <div
    aria-hidden
    className="grain-overlay pointer-events-none fixed inset-0 z-[60] opacity-[0.05] mix-blend-soft-light"
  />
);

export default GrainOverlay;
