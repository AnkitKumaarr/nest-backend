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

/**
 * Returns midnight IST (UTC+5:30) for day `day` of month `month` in year `year`.
 * Uses dayjs for timezone conversion.
 *
 *   startDate for day d  →  toISTMidnight(y, m, d)     →  IST midnight of day d
 *   endDate   for day d  →  toISTMidnight(y, m, d+1)   →  IST midnight of day d+1
 */
export function toISTMidnight(year: number, month: number, day: number): Date {
  return dayjs.tz(`${year}-${month}-${day}`, 'Asia/Kolkata').startOf('day').toDate();
}

/**
 * Builds week slots for a given month and year.
 *
 * Week logic:
 * - Week 1: starts from 1st (any weekday) → nearest Sunday or month-end.
 * - All subsequent weeks: Monday → Sunday or month-end.
 *
 * @param month - Month number (1-12)
 * @param year - Year
 * @returns Array of WeekSlot objects
 */
export function buildWeekSlots(month: number, year: number): WeekSlot[] {
  const daysInMonth = dayjs(`${year}-${month}`).daysInMonth();
  const slots: WeekSlot[] = [];
  let weekNumber = 1;
  let cursor = 1;

  while (cursor <= daysInMonth) {
    const firstDay = cursor;
    const startDow = dayjs(`${year}-${month}-${firstDay}`).day(); // 0=Sun, 1=Mon

    // Week 1: starts from 1st (any weekday) → nearest Sunday or month-end.
    // All subsequent weeks: Monday → Sunday or month-end.
    let lastDay: number;
    if (weekNumber === 1) {
      // First week: go to Sunday or month-end
      const daysUntilSun = (0 - startDow + 7) % 7;
      lastDay = Math.min(firstDay + daysUntilSun, daysInMonth);
    } else {
      // Subsequent weeks: Monday to Sunday
      // If cursor is not Monday, find the next Monday
      const currentDow = dayjs(`${year}-${month}-${cursor}`).day();
      const daysUntilMon = (1 - currentDow + 7) % 7;
      const weekStartDay = cursor + daysUntilMon;

      if (weekStartDay > daysInMonth) break;

      // Go to Sunday or month-end
      const daysUntilSun = (0 - 1 + 7) % 7; // From Monday to Sunday = 6 days
      lastDay = Math.min(weekStartDay + daysUntilSun, daysInMonth);

      // Adjust cursor to the actual week start day
      cursor = weekStartDay;
    }

    const days: WeekDay[] = [];
    for (let d = cursor; d <= lastDay; d++) {
      const dow = dayjs(`${year}-${month}-${d}`).day(); // 0=Sun, 1=Mon, 2=Tue, etc.
      // Adjust index for Monday-first array: dow=0(Sun)->6, dow=1(Mon)->0, dow=2(Tue)->1, etc.
      const dayIndex = (dow + 6) % 7;
      days.push({
        dayId: newObjectId(),
        name: DAY_NAMES[dayIndex],
        date: toISTMidnight(year, month, d),
      });
    }

    slots.push({
      weekNumber,
      label: `Week ${weekNumber}`,
      startDate: toISTMidnight(year, month, cursor),
      endDate: toISTMidnight(year, month, lastDay + 1),
      days,
      weekId: newObjectId(),
    });

    weekNumber++;
    cursor = lastDay + 1;
  }

  return slots;
}
