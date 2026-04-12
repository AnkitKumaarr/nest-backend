import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWeeklyTaskDto } from './dto/create-weekly-task.dto';
import { UpdateWeeklyTaskDto } from './dto/update-weekly-task.dto';
import { ListWeeklyTaskDto } from './dto/list-weekly-task.dto';
import { TaskVisualsService } from '../task-visuals/task-visuals.service';
import { AnalyticsSnapshotService } from '../analytics-snapshot/analytics-snapshot.service';
import { extractTextFromHtml } from '../common/utils/content.util';

const WEEK_SELECT = {
  id: true,
  userId: true,
  companyId: true,
  year: true,
  month: true,
  weeks: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class WeeklyTasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taskVisuals: TaskVisualsService,
    private readonly analyticsSnapshot: AnalyticsSnapshotService,
  ) {}

  async create(
  dto: CreateWeeklyTaskDto,
  userId: string,
  companyId?: string,
) {
  if (!dto.parentId) {
    throw new NotFoundException('Calendar document (parentId) is required');
  }

  if (!dto.weekId) {
    throw new NotFoundException('weekId (weekSlotId) is required');
  }
  if (!dto.descriptionHtml) {
    throw new NotFoundException('Task description is required');
  }

  // 1️⃣ Load calendar document
  const calendar = await this.prisma.week.findUnique({
    where: { id: dto.parentId },
    select: {
      id: true,
      userId: true,
      companyId: true,
      year: true,
      month: true,
      weeks: true,
    },
  });

  if (!calendar) {
    throw new NotFoundException('Calendar document not found');
  }

  // Authorization check
  const isOwner = calendar.userId === userId;
  const isSameCompany =
    companyId && calendar.companyId === companyId;

  if (!isOwner && !isSameCompany) {
    throw new ForbiddenException('Access denied');
  }

  // 2️⃣ Validate weekSlot inside document
  const weekSlot = calendar.weeks.find(
    (w: any) => w.weekId === dto.weekId,
  );

  if (!weekSlot) {
    throw new NotFoundException(
      'Week slot not found inside calendar document',
    );
  }

  let dayId: string | null = null;
  let dayDetails: {
    dayName: string;
    monthName: string;
    monthNumber: number;
    year: number;
    date: Date | null;
  } | null = null;

  // 3️⃣ Validate daySlot (if provided)
  if (dto.dayId) {
    const daySlot = weekSlot.days?.find(
      (d: any) => d.dayId === dto.dayId,
    );

    if (!daySlot) {
      throw new NotFoundException(
        'Day slot not found inside week slot',
      );
    }

    dayId = dto.dayId;

    dayDetails = {
      dayName: daySlot.name ?? '',
      monthName: calendar.month.name,
      monthNumber: calendar.month.number,
      year: calendar.year,
      date: daySlot.date ?? null,
    };
  }

  // 4️⃣ Create task
  const task = await this.prisma.weekTask.create({
    data: {
      parentId: dto.parentId,        // calendar document id
      weekId: dto.weekId,            // weekSlotId
      dayId,
      dayDetails,

      title: dto.title ?? null,
      descriptionHtml: dto.descriptionHtml ?? null,
      descPreview: dto.descPreview ?? (dto.descriptionHtml ? extractTextFromHtml(dto.descriptionHtml) : null),
      startDate: dto.startDate ?? null,
      dueDate: dto.dueDate ?? null,
      priority: dto.priority ?? 'medium',
      status: dto.status ?? 'todo',
      blockerHtml: dto.blockerHtml ?? null,
      blockerPreview: dto.blockerPreview ?? (dto.blockerHtml ? extractTextFromHtml(dto.blockerHtml) : null),
      assignedTo: dto.assignedTo ?? null,

      userId,
      companyId: companyId ?? null,
    },
  });

  // Fire-and-forget updates
  this.taskVisuals.refreshIndividualSnapshots(userId).catch(() => null);
  this.analyticsSnapshot.refreshUserSnapshot(userId).catch(() => null);
  this.updateTaskCount(dto.parentId, dto.weekId, dayId, 1).catch(() => null);

  return task;
}

  async findAll(
    dto: ListWeeklyTaskDto,
    userId: string,
    companyId?: string,
  ) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 25;
    const skip = (page - 1) * limit;

    const where: any = companyId ? { companyId } : { userId };

    if (dto.weekId) {
      where.weekId = dto.weekId;
    }

    if (dto.dayId) {
      where.dayId = dto.dayId;
    }

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.priority) {
      where.priority = dto.priority;
    }

    if (dto.monthName || dto.year) {
      // Get week IDs that match the criteria first
      const weekWhere: any = {};
      if (dto.monthName) {
        weekWhere.month = {
          name: {
            equals: dto.monthName,
            mode: 'insensitive',
          },
        };
      }
      if (dto.year) {
        weekWhere.year = dto.year;
      }
      
      const matchingWeeks = await this.prisma.week.findMany({
        where: weekWhere,
        select: { id: true },
      });
      
      const weekIds = matchingWeeks.map(w => w.id);
      where.weekId = { in: weekIds };
    }

    const [data, totalRecords] = await Promise.all([
      this.prisma.weekTask.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { 
          week: { 
            select: WEEK_SELECT,
          } 
        },
      }),
      this.prisma.weekTask.count({ where }),
    ]);

    return {
      data,
      totalRecords,
      page,
      limit,
      totalPages: Math.ceil(totalRecords / limit),
    };
  }

  async findOne(
    taskId: string,
    userId: string,
    companyId?: string,
  ) {
    const task = await this.prisma.weekTask.findUnique({
      where: { id: taskId },
      include: { week: { select: WEEK_SELECT } },
    });

    if (!task) {
      throw new NotFoundException('Weekly task not found');
    }

    const isOwner = task.userId === userId;
    const isSameCompany =
      companyId && task.companyId === companyId;

    if (!isOwner && !isSameCompany) {
      throw new ForbiddenException('Access denied');
    }

    return task;
  }

  async update(
    dto: UpdateWeeklyTaskDto,
    userId: string,
  ) {
    const task = await this.prisma.weekTask.findUnique({
      where: { id: dto.id },
      include: { week: { select: WEEK_SELECT } },
    });

    if (!task) {
      throw new NotFoundException('Weekly task not found');
    }

    if (task.userId !== userId) {
      throw new ForbiddenException(
        'You can only edit your own tasks',
      );
    }

    const data: any = {};

    if (dto.weekId !== undefined) {
      const weekExists = await this.prisma.week.findUnique({
        where: { id: dto.weekId },
        select: { id: true },
      });

      if (!weekExists) {
        throw new NotFoundException('Week not found');
      }

      data.weekId = dto.weekId;
    }

    if (dto.title !== undefined) data.title = dto.title;
    if (dto.descriptionHtml !== undefined) {
      data.descriptionHtml = dto.descriptionHtml;
      data.descPreview = extractTextFromHtml(dto.descriptionHtml);
    }
    if (dto.descPreview !== undefined) data.descPreview = dto.descPreview;
    if (dto.startDate !== undefined) data.startDate = dto.startDate;
    if (dto.dueDate !== undefined) data.dueDate = dto.dueDate;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.blockerHtml !== undefined) {
      data.blockerHtml = dto.blockerHtml;
      data.blockerPreview = extractTextFromHtml(dto.blockerHtml);
    }
    if (dto.blockerPreview !== undefined) data.blockerPreview = dto.blockerPreview;
    if (dto.assignedTo !== undefined) data.assignedTo = dto.assignedTo;

    const updated = await this.prisma.weekTask.update({
      where: { id: dto.id },
      data,
      include: { week: { select: WEEK_SELECT } },
    });

    this.taskVisuals.refreshIndividualSnapshots(userId).catch(() => null);
    this.analyticsSnapshot.refreshUserSnapshot(userId).catch(() => null);

    return updated;
  }

  async remove(taskId: string, userId: string) {
    const task = await this.prisma.weekTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Weekly task not found');
    }

    if (task.userId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own tasks',
      );
    }

    await this.prisma.weekTask.delete({
      where: { id: taskId },
    });

    this.taskVisuals.refreshIndividualSnapshots(userId).catch(() => null);
    this.analyticsSnapshot.refreshUserSnapshot(userId).catch(() => null);
    this.updateTaskCount(task.parentId, task.weekId, task.dayId, -1).catch(() => null);

    return { message: 'Weekly task deleted successfully' };
  }

  private async updateTaskCount(
    parentId: string | null,
    weekSlotId: string | null,
    dayId: string | null,
    delta: 1 | -1,
  ): Promise<void> {
    if (!parentId || !weekSlotId) return;

    const weekDoc = await this.prisma.week.findUnique({
      where: { id: parentId },
      select: { weeks: true },
    });

    if (!weekDoc) return;

    const updatedWeeks = (weekDoc.weeks as any[]).map((slot) => {
      if (slot.weekId !== weekSlotId) return slot;

      const updatedDays = dayId
        ? slot.days.map((day: any) =>
            day.dayId === dayId
              ? { ...day, taskCount: Math.max(0, (day.taskCount ?? 0) + delta) }
              : day,
          )
        : slot.days;

      return {
        ...slot,
        taskCount: Math.max(0, (slot.taskCount ?? 0) + delta),
        days: updatedDays,
      };
    });

    await this.prisma.week.update({
      where: { id: parentId },
      data: { weeks: updatedWeeks },
    });
  }
}