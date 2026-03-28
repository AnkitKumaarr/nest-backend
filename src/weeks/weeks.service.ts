import { randomBytes } from 'crypto';
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWeekDto } from './dto/create-week.dto';

const newObjectId = () => randomBytes(12).toString('hex');

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Returns midnight IST (UTC+5:30) for day `day` of month `month` in year `year`.
 * Midnight IST = 18:30 UTC of the previous calendar day.
 * JS Date.UTC handles day=0 (→ last day of prev month) and overflow (day=32 → next month) natively.
 *
 *   startDate for day d  →  toISTMidnight(y, m, d)     →  UTC(y, m-1, d-1, 18:30)
 *   endDate   for day d  →  toISTMidnight(y, m, d+1)   →  UTC(y, m-1, d,   18:30)
 *
 * March 2026 example (1st = Sunday):
 *   Week 1:  start "2026-02-28T18:30:00.000Z"  end "2026-03-07T18:30:00.000Z"
 *   Week 5:  start "2026-03-28T18:30:00.000Z"  end "2026-03-31T18:30:00.000Z"
 */
function toISTMidnight(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day - 1, 18, 30, 0));
}

interface WeekDay {
  dayId: string;
  name: string;
  date: Date;
}

interface WeekSlot {
  weekNumber: number;
  label: string;
  startDate: Date;
  endDate: Date;
  days: WeekDay[];
}

function buildWeekSlots(month: number, year: number): WeekSlot[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const slots: WeekSlot[] = [];
  let weekNumber = 1;
  let cursor = 1;

  while (cursor <= daysInMonth) {
    const firstDay = cursor;
    const startDow = new Date(Date.UTC(year, month - 1, firstDay)).getUTCDay(); // 0=Sun

    // Week 1: starts from 1st (any weekday) → nearest Saturday or month-end.
    // All subsequent weeks: Sunday → Saturday or month-end.
    const daysUntilSat = (6 - startDow + 7) % 7;
    const lastDay = Math.min(firstDay + daysUntilSat, daysInMonth);

    const days: WeekDay[] = [];
    for (let d = firstDay; d <= lastDay; d++) {
      const dow = new Date(Date.UTC(year, month - 1, d)).getUTCDay();
      days.push({ dayId: newObjectId(), name: DAY_NAMES[dow], date: toISTMidnight(year, month, d) });
    }

    slots.push({
      weekNumber,
      label: `Week ${weekNumber}`,
      startDate: toISTMidnight(year, month, firstDay),
      endDate: toISTMidnight(year, month, lastDay + 1),
      days,
    });

    weekNumber++;
    cursor = lastDay + 1;
  }

  return slots;
}

@Injectable()
export class WeeksService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateWeekDto, userId: string, companyId?: string | null) {
    const { month, year } = dto;
    const monthName = MONTH_NAMES[month - 1];

    // Build all possible week slots for this month
    const slots = buildWeekSlots(month, year);

    // Find which week numbers already exist in DB
    const existing = await this.prisma.week.findMany({
      where: { month: { is: { number: month } }, year, userId },
      select: { weekNumber: true },
    });

    if (existing.length >= slots.length) {
      // All possible weeks already exist — true conflict
      return {
        success: false,
        message: `Weeks already exist for ${monthName} ${year} for this user`,
        existingCount: existing.length,
      };
    }

    // Create only the missing week slots (deleted ones can be re-created)
    const existingWeekNumbers = new Set(existing.map((w) => w.weekNumber));
    const missingSlots = slots.filter((s) => !existingWeekNumbers.has(s.weekNumber));

    await Promise.all(
      missingSlots.map((slot) =>
        this.prisma.week.create({
          data: {
            label: slot.label,
            weekNumber: slot.weekNumber,
            month: { monthId: newObjectId(), name: monthName, number: month },
            year,
            startDate: slot.startDate,
            endDate: slot.endDate,
            days: slot.days,
            userId,
            companyId: companyId ?? null,
          },
        }),
      ),
    );

    return {
      success: true,
      message: `${missingSlots.length} weeks created for ${monthName} ${year}`,
      weeksCreated: missingSlots.length,
      month,
      monthName,
      year,
    };
  }

  async findAll(userId: string, companyId?: string | null) {
    const where: any = companyId ? { companyId } : { userId };
    return this.prisma.week.findMany({
      where,
      orderBy: [{ year: 'asc' }, { weekNumber: 'asc' }],
      include: { _count: { select: { weekTasks: true } } },
    });
  }

  async remove(weekId: string, userId: string) {
    const week = await this.prisma.week.findUnique({ where: { id: weekId } });
    if (!week) throw new NotFoundException('Week not found');
    if (week.userId !== userId) throw new ForbiddenException('Not authorized to delete this week');
    return this.prisma.week.delete({ where: { id: weekId } });
  }
}
