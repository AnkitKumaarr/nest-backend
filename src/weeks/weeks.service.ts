import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWeekDto } from './dto/create-week.dto';
import { UpdateWeekDto } from './dto/update-week.dto';
import dayjs from '../utils/dayjs';
import {
  newObjectId,
  DAY_NAMES,
  MONTH_NAMES,
  toISTMidnight,
  buildWeekSlots,
} from './weekUtils';

@Injectable()
export class WeeksService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateWeekDto, userId: string, companyId?: string | null) {
    const { month, year } = dto;
    const monthName = MONTH_NAMES[month - 1];

    const slots = buildWeekSlots(month, year);

    const startDate = toISTMidnight(year, month, 1);
    const daysInMonth = dayjs(`${year}-${month}`).daysInMonth();
    const endDate = toISTMidnight(year, month, daysInMonth + 1);

    const startDow = dayjs(`${year}-${month}-1`).day();
    const endDow = dayjs(`${year}-${month}-${daysInMonth}`).day();

    const startDayIndex = (startDow + 6) % 7;
    const endDayIndex = (endDow + 6) % 7;

    const startDay = DAY_NAMES[startDayIndex];
    const endDay = DAY_NAMES[endDayIndex];

    const allYearWeeks = await this.prisma.week.findMany({
      where: {
        year,
        userId,
      },
    });

    const existing = allYearWeeks.find(week => week.month?.number === month) || null;

    if (existing) {
      const existingWeekNumbers = existing.weeks.map((w: any) => w.weekNumber);

      const missingWeeks = slots.filter(
        (slot) => !existingWeekNumbers.includes(slot.weekNumber),
      );

      if (missingWeeks.length === 0) {
        throw new ForbiddenException(
          `Weeks already exist for ${monthName} ${year} for this user`,
        );
      }

      const updatedWeeks = [...existing.weeks];
      missingWeeks.forEach(missingWeek => {
        const weekWithTaskCount = {
          ...missingWeek,
          weekId: missingWeek.weekId || null,
          taskCount: null,
          days: missingWeek.days.map(day => ({
            ...day,
            taskCount: null
          }))
        };
        
        const insertIndex = updatedWeeks.findIndex(
          existingWeek => existingWeek.weekNumber > weekWithTaskCount.weekNumber
        );
        
        if (insertIndex === -1) {
          updatedWeeks.push(weekWithTaskCount);
        } else {
          updatedWeeks.splice(insertIndex, 0, weekWithTaskCount);
        }
      });

      await this.prisma.week.update({
        where: { id: existing.id },
        data: { weeks: updatedWeeks },
      });

      return {
        success: true,
        message: `${missingWeeks.length} missing weeks added for ${monthName} ${year}`,
        weeksAdded: missingWeeks.length,
        totalWeeks: updatedWeeks.length,
        month,
        monthName,
        year,
      };
    }

    const slotsWithTaskCount = slots.map(slot => ({
      ...slot,
      weekId: slot.weekId || null,
      taskCount: null,
      days: slot.days.map(day => ({
        ...day,
        taskCount: null
      }))
    }));

    await this.prisma.week.create({
      data: {
        userId,
        companyId: companyId ?? null,
        year,
        month: {
          monthId: newObjectId(),
          name: monthName,
          number: month,
          startDate,
          endDate,
          startDay,
          endDay,
        },
        weeks: slotsWithTaskCount,
      },
    });

    return {
      success: true,
      message: `${slots.length} weeks created for ${monthName} ${year}`,
      weeksCreated: slots.length,
      month,
      monthName,
      year,
    };
  }

  async findAll(userId: string, companyId?: string | null, year?: number) {
    const where: any = companyId ? { companyId } : { userId };

    if (year) {
      where.year = year;
    }

    const weeks = await this.prisma.week.findMany({
      where,
      orderBy: [{ year: 'asc' }, { month: { number: 'asc' } }],
    });

    const flattenedWeeks = weeks.flatMap((week: any) =>
      week.weeks.map((weekSlot: any) => ({
        id: week.id,
        weekId: weekSlot.weekId,
        label: weekSlot.label,
        weekNumber: weekSlot.weekNumber,
        month: week.month.name,
        year: week.year,
        startDate: weekSlot.startDate,
        endDate: weekSlot.endDate,
        days: weekSlot.days,
        weekTasks: weekSlot.taskCount ?? 0,
        userId: week.userId,
        companyId: week.companyId,
        createdAt: week.createdAt,
        updatedAt: week.updatedAt,
      })),
    );

    return flattenedWeeks;
  }

  async update(dto: UpdateWeekDto, userId: string) {
    const document = await this.prisma.week.findUnique({
      where: { id: dto.id },
      select: { id: true, weeks: true, userId: true },
    });

    if (!document) {
      throw new NotFoundException('Calendar document not found');
    }

    if (document.userId !== userId) {
      throw new ForbiddenException('Not authorized to modify this calendar');
    }

    const weekExists = document.weeks.some(
      (w: any) => w.weekId === dto.weekId,
    );

    if (!weekExists) {
      throw new NotFoundException('Week not found in the calendar document');
    }

    // ✅ Corrected: check tasks using dto.weekId
    const taskCount = await this.prisma.weekTask.count({
      where: { weekId: dto.weekId },
    });

    if (taskCount > 0) {
      throw new ForbiddenException(
        'Week cannot be deleted because it is attached to tasks',
      );
    }

    if (document.weeks.length === 1) {
      await this.prisma.week.delete({ where: { id: dto.id } });

      return {
        success: true,
        message: 'Week removed successfully',
        action: 'document_deleted',
      };
    }

    const updatedWeeks = document.weeks.filter(
      (w: any) => w.weekId !== dto.weekId,
    );

    await this.prisma.week.update({
      where: { id: dto.id },
      data: { weeks: updatedWeeks },
    });

    return {
      success: true,
      message: 'Week removed successfully',
      action: 'week_removed',
      remainingWeeks: updatedWeeks.length,
    };
  }
}