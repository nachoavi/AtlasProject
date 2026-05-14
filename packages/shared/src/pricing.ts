/**
 * Helpers de pricing y descuentos.
 * Reglas según el plan §3 / §3.1:
 *   - Descuentos en cascada: se elige el MAYOR descuento aplicable entre subscription
 *     activa y session packs activos. NO se acumulan.
 */

export type DiscountSource =
  | { kind: 'subscription'; code: string; pct: number }
  | { kind: 'session_pack'; code: string; pct: number };

export function pickBestDiscount(sources: DiscountSource[]): DiscountSource | null {
  if (sources.length === 0) return null;
  return sources.reduce((best, s) => (s.pct > best.pct ? s : best));
}

/** Calcula precio final aplicando un % de descuento. Trunca al peso entero (CLP). */
export function applyDiscount(basePriceClp: number, discountPct: number): number {
  if (discountPct <= 0) return basePriceClp;
  if (discountPct >= 100) return 0;
  return Math.floor(basePriceClp * (1 - discountPct / 100));
}

/** Formatea un monto CLP con separadores de miles. Ej: 43000 → "$43.000". */
export function formatClp(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount);
}
