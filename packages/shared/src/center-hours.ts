import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { CENTER_TIMEZONE } from './constants.js';

export type OperatingBlock = {
  weekday: number; // 0 = domingo ... 6 = sábado
  blockStart: string; // "HH:mm"
  blockEnd: string; // "HH:mm"
  label?: string;
};

/** Horarios oficiales del centro Atlas (La Unión). Fuente de verdad para v1. */
export const DEFAULT_OPERATING_HOURS: OperatingBlock[] = [
  // Lunes a viernes
  ...[1, 2, 3, 4, 5].flatMap((w) => [
    { weekday: w, blockStart: '06:00', blockEnd: '13:00', label: 'Mañana' },
    { weekday: w, blockStart: '15:00', blockEnd: '22:30', label: 'Tarde' },
  ]),
  // Sábado
  { weekday: 6, blockStart: '08:00', blockEnd: '13:00', label: 'Mañana' },
  { weekday: 6, blockStart: '15:00', blockEnd: '22:00', label: 'Tarde' },
  // Domingo cerrado (sin bloques)
];

function parseHHmm(s: string): { h: number; m: number } {
  const [hStr = '0', mStr = '0'] = s.split(':');
  return { h: parseInt(hStr, 10), m: parseInt(mStr, 10) };
}

function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function blockMinutes(block: OperatingBlock): { start: number; end: number } {
  const s = parseHHmm(block.blockStart);
  const e = parseHHmm(block.blockEnd);
  return { start: s.h * 60 + s.m, end: e.h * 60 + e.m };
}

/** Devuelve true si el centro está abierto en el instante `at` (UTC date). */
export function isOpen(
  at: Date,
  hours: OperatingBlock[] = DEFAULT_OPERATING_HOURS,
  closedDates: ReadonlySet<string> = new Set(),
): boolean {
  const local = toZonedTime(at, CENTER_TIMEZONE);
  const dateKey = formatDateKey(local);
  if (closedDates.has(dateKey)) return false;

  const weekday = local.getDay();
  const minutes = minutesOfDay(local);
  return hours
    .filter((b) => b.weekday === weekday)
    .some((b) => {
      const { start, end } = blockMinutes(b);
      return minutes >= start && minutes < end;
    });
}

/** Próximo instante en que el centro abre, a partir de `from`. */
export function nextOpening(
  from: Date,
  hours: OperatingBlock[] = DEFAULT_OPERATING_HOURS,
  closedDates: ReadonlySet<string> = new Set(),
): Date | null {
  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const candidate = toZonedTime(from, CENTER_TIMEZONE);
    candidate.setDate(candidate.getDate() + dayOffset);
    const dateKey = formatDateKey(candidate);
    if (closedDates.has(dateKey)) continue;

    const weekday = candidate.getDay();
    const dayBlocks = hours
      .filter((b) => b.weekday === weekday)
      .sort((a, b) => a.blockStart.localeCompare(b.blockStart));

    for (const block of dayBlocks) {
      const { h, m } = parseHHmm(block.blockStart);
      const localOpen = new Date(candidate);
      localOpen.setHours(h, m, 0, 0);
      const utcOpen = fromZonedTime(localOpen, CENTER_TIMEZONE);
      if (utcOpen > from) return utcOpen;
    }
  }
  return null;
}

/** Bloques de operación de un día específico (en zona local del centro). */
export function operatingBlocks(
  date: Date,
  hours: OperatingBlock[] = DEFAULT_OPERATING_HOURS,
): OperatingBlock[] {
  const local = toZonedTime(date, CENTER_TIMEZONE);
  const weekday = local.getDay();
  return hours
    .filter((b) => b.weekday === weekday)
    .sort((a, b) => a.blockStart.localeCompare(b.blockStart));
}

/** Genera slots agendables para un día, dado duración y gap entre slots. */
export function generateSlots(
  date: Date,
  durationMin: number,
  gapMin: number = 0,
  hours: OperatingBlock[] = DEFAULT_OPERATING_HOURS,
): Array<{ start: Date; end: Date }> {
  const blocks = operatingBlocks(date, hours);
  const slots: Array<{ start: Date; end: Date }> = [];
  const local = toZonedTime(date, CENTER_TIMEZONE);

  for (const block of blocks) {
    const { h: sh, m: sm } = parseHHmm(block.blockStart);
    const { h: eh, m: em } = parseHHmm(block.blockEnd);

    let cursorMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    const step = durationMin + gapMin;

    while (cursorMinutes + durationMin <= endMinutes) {
      const startLocal = new Date(local);
      startLocal.setHours(Math.floor(cursorMinutes / 60), cursorMinutes % 60, 0, 0);
      const endLocal = new Date(startLocal);
      endLocal.setMinutes(endLocal.getMinutes() + durationMin);

      slots.push({
        start: fromZonedTime(startLocal, CENTER_TIMEZONE),
        end: fromZonedTime(endLocal, CENTER_TIMEZONE),
      });

      cursorMinutes += step;
    }
  }
  return slots;
}

/** Valida que [start, end] cabe completo en un único bloque de operación. */
export function isWithinOperatingHours(
  start: Date,
  end: Date,
  hours: OperatingBlock[] = DEFAULT_OPERATING_HOURS,
): boolean {
  if (end <= start) return false;
  const localStart = toZonedTime(start, CENTER_TIMEZONE);
  const localEnd = toZonedTime(end, CENTER_TIMEZONE);

  if (formatDateKey(localStart) !== formatDateKey(localEnd)) return false;

  const weekday = localStart.getDay();
  const startMin = minutesOfDay(localStart);
  const endMin = minutesOfDay(localEnd);

  return hours
    .filter((b) => b.weekday === weekday)
    .some((b) => {
      const { start: bs, end: be } = blockMinutes(b);
      return startMin >= bs && endMin <= be;
    });
}

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
