import { randomBytes } from 'crypto';
import dayjs from '../utils/dayjs';

/**
 * Generates a random ObjectId string
 */
export const newObjectId = () => randomBytes(12).toString('hex');

/**
 * Array of day names starting from Sunday
 */
export const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

/**
 * Array of month names
 */
export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Interface representing a day in a week
 */
export interface WeekDay {
  dayId: string;
  name: string;
  date: Date;
}

/**
 * Interface representing a week slot with its days
 */
export interface WeekSlot {
  weekNumber: number;
  label: string;
  startDate: Date;
  endDate: Date;
  days: WeekDay[];
  weekId?: string;
}

export function getMonthBoundaries(month: number, year: number) {
  return {
    startDate: new Date(Date.UTC(year, month - 1, 1)),
    endDate: new Date(Date.UTC(year, month, 1)),
  };
}

export function getDaysInMonth(month: number, year: number): number {
  return dayjs.utc(`${year}-${month}-01`).daysInMonth();
}

export function getDayName(year: number, month: number, day: number): string {
  const dow = dayjs.utc(`${year}-${month}-${day}`).day();
  return DAY_NAMES[(dow + 6) % 7];
}

export function getMonthMeta(month: number, year: number) {
  const daysInMonth = getDaysInMonth(month, year);
  const { startDate, endDate } = getMonthBoundaries(month, year);
  const startDay = getDayName(year, month, 1);
  const endDay = getDayName(year, month, daysInMonth);
  return { daysInMonth, startDate, endDate, startDay, endDay };
}

export function normalizeWeekSlots(slots: WeekSlot[]) {
  return slots.map((slot) => ({
    ...slot,
    weekId: slot.weekId ?? null,
    taskCount: null,
    days: slot.days.map((day) => ({ ...day, taskCount: null })),
  }));
}

export function getMissingWeeks(existingWeeks: any[], generatedSlots: WeekSlot[]) {
  const existingNumbers = new Set(existingWeeks.map((w) => w.weekNumber));
  return generatedSlots.filter((slot) => !existingNumbers.has(slot.weekNumber));
}

export function mergeWeeksInOrder(existingWeeks: any[], newWeeks: any[]) {
  const merged = [...existingWeeks];
  newWeeks.forEach((week) => {
    const insertAt = merged.findIndex((w) => w.weekNumber > week.weekNumber);
    insertAt === -1 ? merged.push(week) : merged.splice(insertAt, 0, week);
  });
  return merged;
}

function toStartDate(year: number, month: number, day: number): Date {
  return dayjs.utc(`${year}-${month}-${day}`).startOf('day').toDate();
}

function toEndDate(year: number, month: number, day: number): Date {
  return dayjs.utc(`${year}-${month}-${day}`).endOf('day').toDate();
}

function buildWeekDay(year: number, month: number, day: number): WeekDay {
  const dow = dayjs.utc(`${year}-${month}-${day}`).day();
  return {
    dayId: newObjectId(),
    name: DAY_NAMES[(dow + 6) % 7],
    date: toStartDate(year, month, day),
  };
}

function buildDaysRange(
  year: number,
  month: number,
  startDay: number,
  endDay: number,
): WeekDay[] {
  return Array.from({ length: endDay - startDay + 1 }, (_, i) =>
    buildWeekDay(year, month, startDay + i),
  );
}

export function buildWeekSlots(month: number, year: number): WeekSlot[] {
  const totalDays = getDaysInMonth(month, year);
  const firstDayOfMonth = dayjs.utc(`${year}-${month}-01`);
  const firstDow = firstDayOfMonth.day();
  const slots: WeekSlot[] = [];
  let weekNumber = 1;
  let startDay = 1;

  while (startDay <= totalDays) {
    const endDay =
      weekNumber === 1
        ? Math.min(1 + ((7 - firstDow) % 7), totalDays)
        : Math.min(startDay + 6, totalDays);

    slots.push({
      weekNumber,
      label:
        weekNumber === 1 && firstDow !== 1
          ? 'Week 1(Partial)'
          : endDay === totalDays && endDay - startDay + 1 < 7
            ? `Week ${weekNumber}(Partial)`
            : `Week ${weekNumber}`,
      startDate: toStartDate(year, month, startDay),
      endDate: toEndDate(year, month, endDay),
      days: buildDaysRange(year, month, startDay, endDay),
      weekId: newObjectId(),
    });

    weekNumber++;
    startDay = endDay + 1;
  }

  return slots;
}

export const getCurrentWeek = (
  weeks: Array<{ startDate: Date | string; endDate: Date | string }>,
) => {
  const now = Date.now();

  return (
    weeks.find((week) => {
      const start = new Date(week.startDate).getTime();
      const end = new Date(week.endDate).getTime();
      return now >= start && now <= end;
    }) ?? null
  );
};
