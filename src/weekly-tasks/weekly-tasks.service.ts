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

const WEEK_SELECT = {
  id: true,
  label: true,
  weekNumber: true,
  startDate: true,
  endDate: true,
  month: true,
  year: true,
};

@Injectable()
export class WeeklyTasksService {
  constructor(
    private prisma: PrismaService,
    private taskVisuals: TaskVisualsService,
    private analyticsSnapshot: AnalyticsSnapshotService,
  ) {}

  async create(dto: CreateWeeklyTaskDto, userId: string, companyId?: string) {
    let weekId = dto.weekId;
    let dayId: string | null = null;
    let dayDetails: {
      dayName: string; monthName: string; monthNumber: number; year: number; date: Date | null;
    } | null = null;

    if (dto.dayId) {
      const week = await this.prisma.week.findFirst({
        where: { days: { some: { dayId: dto.dayId } } },
        select: { id: true, month: true, year: true, days: true },
      });
      if (!week) throw new NotFoundException('Week not found for the given dayId');
      weekId = week.id;
      dayId = dto.dayId;
      const day = week.days.find((d) => d.dayId === dto.dayId);
      dayDetails = {
        dayName: day?.name ?? '',
        monthName: week.month.name,
        monthNumber: week.month.number,
        year: week.year,
        date: day?.date ?? null,
      };
    } else if (weekId) {
      const week = await this.prisma.week.findUnique({ where: { id: weekId } });
      if (!week) throw new NotFoundException('Week not found');
    } else {
      throw new NotFoundException('Provide either weekId or dayId');
    }

    const task = await this.prisma.weekTask.create({
      data: {
        weekId,
        title: dto.title ?? null,
        content: dto.content ?? null,
        startDate: dto.startDate ?? null,
        dayId,
        dayDetails,
        dueDate: dto.dueDate ?? null,
        priority: dto.priority ?? 'medium',
        status: dto.status ?? 'todo',
        blocker: dto.blocker ?? null,
        assignedTo: dto.assignedTo ?? null,
        userId,
        companyId: companyId ?? null,
      },
      include: { week: { select: WEEK_SELECT } },
    });

    // Fire-and-forget: refresh individual visual and analytics snapshots
    this.taskVisuals.refreshIndividualSnapshots(userId).catch(() => null);
    this.analyticsSnapshot.refreshUserSnapshot(userId).catch(() => null);

    return task;
  }

  async findAll(dto: ListWeeklyTaskDto, userId: string, companyId?: string) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 25;
    const skip = (page - 1) * limit;

    const where: any = companyId ? { companyId } : { userId };

    if (dto.dayId) {
      const week = await this.prisma.week.findFirst({
        where: { days: { some: { dayId: dto.dayId } } },
        select: { id: true },
      });
      if (!week) throw new NotFoundException('Week not found for the given dayId');
      where.weekId = week.id;
    }

    // Filter by monthName or year via the related Week
    if (dto.monthName || dto.year) {
      where.week = {};
      if (dto.monthName) where.week.monthName = { equals: dto.monthName, mode: 'insensitive' };
      if (dto.year) where.week.year = dto.year;
    }

    const [data, totalRecords] = await Promise.all([
      this.prisma.weekTask.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { week: { select: WEEK_SELECT } },
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

  async findOne(taskId: string, userId: string, companyId?: string) {
    const task = await this.prisma.weekTask.findUnique({
      where: { id: taskId },
      include: { week: { select: WEEK_SELECT } },
    });
    if (!task) throw new NotFoundException('Weekly task not found');

    const isOwner = task.userId === userId;
    const isSameCompany = companyId && task.companyId === companyId;
    if (!isOwner && !isSameCompany) throw new ForbiddenException('Access denied');

    return task;
  }

  async update(dto: UpdateWeeklyTaskDto, userId: string) {
    const task = await this.prisma.weekTask.findUnique({ where: { id: dto.id } });
    if (!task) throw new NotFoundException('Weekly task not found');
    if (task.userId !== userId) throw new ForbiddenException('You can only edit your own tasks');

    const data: any = {};
    if (dto.weekId !== undefined) {
      const week = await this.prisma.week.findUnique({ where: { id: dto.weekId } });
      if (!week) throw new NotFoundException('Week not found');
      data.weekId = dto.weekId;
    }
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.startDate !== undefined) data.startDate = dto.startDate;
    if (dto.dueDate !== undefined) data.dueDate = dto.dueDate;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.blocker !== undefined) data.blocker = dto.blocker;
    if (dto.assignedTo !== undefined) data.assignedTo = dto.assignedTo;

    const updated = await this.prisma.weekTask.update({
      where: { id: dto.id },
      data,
      include: { week: { select: WEEK_SELECT } },
    });

    // Fire-and-forget
    this.taskVisuals.refreshIndividualSnapshots(userId).catch(() => null);
    this.analyticsSnapshot.refreshUserSnapshot(userId).catch(() => null);

    return updated;
  }

  async remove(taskId: string, userId: string) {
    const task = await this.prisma.weekTask.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Weekly task not found');
    if (task.userId !== userId) throw new ForbiddenException('You can only delete your own tasks');

    await this.prisma.weekTask.delete({ where: { id: taskId } });

    // Fire-and-forget
    this.taskVisuals.refreshIndividualSnapshots(userId).catch(() => null);
    this.analyticsSnapshot.refreshUserSnapshot(userId).catch(() => null);

    return { message: 'Weekly task deleted successfully' };
  }
}
