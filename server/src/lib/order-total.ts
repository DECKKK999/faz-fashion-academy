export function computeOrderTotal(base_price_idr: number, discount_idr: number): { total_idr: number } {
  return { total_idr: Math.max(0, base_price_idr - discount_idr) };
}
