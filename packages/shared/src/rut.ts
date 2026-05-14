/**
 * Validación y formateo de RUT chileno.
 * El RUT consiste en un número seguido de un dígito verificador (0-9 o K).
 */

export function cleanRut(rut: string): string {
  return rut.replace(/[.\s-]/g, '').toUpperCase();
}

export function computeRutDv(numericPart: string): string {
  let sum = 0;
  let multiplier = 2;
  for (let i = numericPart.length - 1; i >= 0; i--) {
    sum += parseInt(numericPart[i]!, 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = 11 - (sum % 11);
  if (remainder === 11) return '0';
  if (remainder === 10) return 'K';
  return String(remainder);
}

export function isValidRut(rut: string): boolean {
  const clean = cleanRut(rut);
  if (!/^\d{7,8}[0-9K]$/.test(clean)) return false;
  const numericPart = clean.slice(0, -1);
  const dv = clean.slice(-1);
  return computeRutDv(numericPart) === dv;
}

export function formatRut(rut: string): string {
  const clean = cleanRut(rut);
  if (clean.length < 2) return clean;
  const numericPart = clean.slice(0, -1);
  const dv = clean.slice(-1);
  const formatted = numericPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted}-${dv}`;
}
