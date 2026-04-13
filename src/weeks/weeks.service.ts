import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWeekDto } from './dto/create-week.dto';
import { UpdateWeekDto } from './dto/update-week.dto';
import {
  newObjectId,
  MONTH_NAMES,
  buildWeekSlots,
  getMonthMeta,
  getCurrentWeek,
  normalizeWeekSlots,
  getMissingWeeks,
  mergeWeeksInOrder,
} from './weekUtils';

@Injectable()
export class WeeksService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateWeekDto, userId: string, companyId?: string | null) {
    const { month, year } = dto;

    if (month < 1 || month > 12) {
      throw new Error('Month must be between 1 and 12');
    }

    const monthName = MONTH_NAMES[month - 1];
    const generatedSlots = buildWeekSlots(month, year);
    const { startDate, endDate, startDay, endDay } = getMonthMeta(month, year);

    const existing = await this.prisma.week.findUnique({
      where: { userId_year_monthNumber: { userId, year, monthNumber: month } },
    });

    if (existing) {
      const missing = getMissingWeeks(existing.weeks, generatedSlots);

      if (missing.length === 0) {
        throw new ForbiddenException(
          `Weeks already exist for ${monthName} ${year}`,
        );
      }

      const merged = mergeWeeksInOrder(
        existing.weeks,
        normalizeWeekSlots(missing),
      );

      await this.prisma.week.update({
        where: { id: existing.id },
        data: { weeks: merged },
      });

      return {
        success: true,
        message: `${missing.length} missing weeks added`,
        weeksAdded: missing.length,
        totalWeeks: merged.length,
        month,
        monthName,
        year,
      };
    }

    const normalizedSlots = normalizeWeekSlots(generatedSlots);

    await this.prisma.week.create({
      data: {
        userId,
        companyId: companyId ?? null,
        year,
        monthNumber: month,
        month: {
          monthId: newObjectId(),
          name: monthName,
          number: month,
          startDate,
          endDate,
          startDay,
          endDay,
        },
        weeks: normalizedSlots,
      },
    });

    return {
      success: true,
      message: `${normalizedSlots.length} weeks created successfully`,
      weeksCreated: normalizedSlots.length,
      month,
      monthName,
      year,
    };
  }

  private async ensureMonthWeeksExist(
    month: number,
    year: number,
    userId: string,
    companyId?: string | null,
  ) {
    const generatedSlots = buildWeekSlots(month, year);
    const { startDate, endDate, startDay, endDay } = getMonthMeta(month, year);
    const monthName = MONTH_NAMES[month - 1];

    const existing = await this.prisma.week.findUnique({
      where: { userId_year_monthNumber: { userId, year, monthNumber: month } },
    });

    if (!existing) {
      await this.prisma.week.create({
        data: {
          userId,
          companyId: companyId ?? null,
          year,
          monthNumber: month,
          month: {
            monthId: newObjectId(),
            name: monthName,
            number: month,
            startDate,
            endDate,
            startDay,
            endDay,
          },
          weeks: normalizeWeekSlots(generatedSlots),
        },
      });
      return;
    }

    const missing = getMissingWeeks(existing.weeks, generatedSlots);
    if (missing.length === 0) return;

    const merged = mergeWeeksInOrder(
      existing.weeks,
      normalizeWeekSlots(missing),
    );

    await this.prisma.week.update({
      where: { id: existing.id },
      data: { weeks: merged },
    });
  }

  async findAll(userId: string, companyId?: string | null, year?: number) {
    const now = new Date();
    await this.ensureMonthWeeksExist(
      now.getMonth() + 1,
      now.getFullYear(),
      userId,
      companyId,
    );

    const where: any = companyId ? { companyId } : { userId };
    if (year) where.year = year;

    const weeks = await this.prisma.week.findMany({
      where,
      orderBy: [{ year: 'asc' }, { monthNumber: 'asc' }],
    });

    const flattenedWeeks = weeks.flatMap((item: any) =>
      item.weeks.map((weekSlot: any) => ({
        id: item.id,
        weekId: weekSlot.weekId,
        label: weekSlot.label,
        weekNumber: weekSlot.weekNumber,
        monthName: item.month.name,
        monthNumber: item.monthNumber,
        year: item.year,
        startDate: weekSlot.startDate,
        endDate: weekSlot.endDate,
        days: weekSlot.days,
        weekTaskCount: weekSlot.taskCount ?? 0,
        userId: item.userId,
        companyId: item.companyId,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
    );

    const currentWeek = getCurrentWeek(flattenedWeeks);

    return { weeks: flattenedWeeks, currentWeek };
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

    const weekExists = document.weeks.some((w: any) => w.weekId === dto.weekId);

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
