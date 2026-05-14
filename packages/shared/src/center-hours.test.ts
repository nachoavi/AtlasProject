import { describe, expect, it } from 'vitest';
import { fromZonedTime } from 'date-fns-tz';
import {
  DEFAULT_OPERATING_HOURS,
  isOpen,
  isWithinOperatingHours,
  generateSlots,
  operatingBlocks,
} from './center-hours.js';
import { CENTER_TIMEZONE } from './constants.js';

function localDate(iso: string): Date {
  return fromZonedTime(iso, CENTER_TIMEZONE);
}

describe('isOpen', () => {
  it('open Monday 08:00', () => {
    // 2026-03-02 es lunes
    expect(isOpen(localDate('2026-03-02T08:00:00'))).toBe(true);
  });
  it('closed Monday 14:00 (siesta)', () => {
    expect(isOpen(localDate('2026-03-02T14:00:00'))).toBe(false);
  });
  it('open Monday 15:00', () => {
    expect(isOpen(localDate('2026-03-02T15:00:00'))).toBe(true);
  });
  it('closed Sunday 10:00', () => {
    // 2026-03-01 es domingo
    expect(isOpen(localDate('2026-03-01T10:00:00'))).toBe(false);
  });
  it('closed Saturday 23:00', () => {
    // 2026-03-07 es sábado, cierra 22:00
    expect(isOpen(localDate('2026-03-07T23:00:00'))).toBe(false);
  });
});

describe('operatingBlocks', () => {
  it('returns 2 blocks for weekdays', () => {
    const blocks = operatingBlocks(localDate('2026-03-02T10:00:00'));
    expect(blocks).toHaveLength(2);
    expect(blocks[0]!.blockStart).toBe('06:00');
  });
  it('returns 0 blocks for Sunday', () => {
    expect(operatingBlocks(localDate('2026-03-01T10:00:00'))).toHaveLength(0);
  });
});

describe('isWithinOperatingHours', () => {
  it('valid slot Monday morning', () => {
    expect(
      isWithinOperatingHours(localDate('2026-03-02T07:00:00'), localDate('2026-03-02T08:00:00')),
    ).toBe(true);
  });
  it('invalid: spans the siesta gap', () => {
    expect(
      isWithinOperatingHours(localDate('2026-03-02T12:30:00'), localDate('2026-03-02T15:30:00')),
    ).toBe(false);
  });
  it('invalid: outside operating hours', () => {
    expect(
      isWithinOperatingHours(localDate('2026-03-02T05:00:00'), localDate('2026-03-02T05:30:00')),
    ).toBe(false);
  });
});

describe('generateSlots', () => {
  it('generates 60 min slots respecting both blocks on a weekday', () => {
    const slots = generateSlots(localDate('2026-03-02T00:00:00'), 60, 0);
    // Mañana: 06-13 → 7 slots. Tarde: 15-22:30 → 7 slots (22:00 end + 30min restantes no caben)
    expect(slots.length).toBe(14);
  });
  it('returns empty for Sunday', () => {
    expect(generateSlots(localDate('2026-03-01T00:00:00'), 60, 0)).toHaveLength(0);
  });
});

describe('default operating hours seed', () => {
  it('has 12 blocks for the week (5 weekdays × 2 + 1 saturday × 2)', () => {
    expect(DEFAULT_OPERATING_HOURS).toHaveLength(12);
  });
  it('has no Sunday blocks', () => {
    expect(DEFAULT_OPERATING_HOURS.filter((b) => b.weekday === 0)).toHaveLength(0);
  });
});
