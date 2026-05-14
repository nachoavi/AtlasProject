import { describe, expect, it } from 'vitest';
import { cleanRut, computeRutDv, formatRut, isValidRut } from './rut.js';

describe('cleanRut', () => {
  it('strips dots, dashes, and spaces, uppercases K', () => {
    expect(cleanRut('12.345.678-k')).toBe('12345678K');
    expect(cleanRut('  11.111.111-1  ')).toBe('111111111');
  });
});

describe('computeRutDv', () => {
  it('returns valid dígito verificador for known RUTs', () => {
    // Conocidos: 11.111.111-1, 12.345.678-5, 1-9
    expect(computeRutDv('11111111')).toBe('1');
    expect(computeRutDv('12345678')).toBe('5');
    expect(computeRutDv('1')).toBe('9');
  });
});

describe('isValidRut', () => {
  it('accepts valid RUTs with various formatting', () => {
    expect(isValidRut('11.111.111-1')).toBe(true);
    expect(isValidRut('111111111')).toBe(true);
    expect(isValidRut('12.345.678-5')).toBe(true);
  });

  it('rejects malformed or invalid RUTs', () => {
    expect(isValidRut('12345678-0')).toBe(false); // wrong DV
    expect(isValidRut('abc')).toBe(false);
    expect(isValidRut('')).toBe(false);
  });
});

describe('formatRut', () => {
  it('formats with dots and dash', () => {
    expect(formatRut('111111111')).toBe('11.111.111-1');
    expect(formatRut('12345678K')).toBe('12.345.678-K');
  });
});
