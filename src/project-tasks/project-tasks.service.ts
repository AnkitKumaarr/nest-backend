import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectTaskDto } from './dto/create-project-task.dto';
import { ListTasksDto } from './dto/list-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { renderHtml, extractPreview } from '../common/utils/content.util';
import { TaskVisualsService } from '../task-visuals/task-visuals.service';
import { AnalyticsSnapshotService } from '../analytics-snapshot/analytics-snapshot.service';

@Injectable()
export class ProjectTasksService {
  constructor(
    private prisma: PrismaService,
    private taskVisuals: TaskVisualsService,
    private analyticsSnapshot: AnalyticsSnapshotService,
  ) {}

  async create(dto: CreateProjectTaskDto, tokenCreatorId: string, tokenCompanyId: string) {
    // Get companyId from team if token doesn't carry it
    const team = await this.prisma.team.findFirst({ where: { id: dto.teamId } });
    if (!team) throw new NotFoundException('Team not found');
    const companyId = tokenCompanyId || team.companyId;

    const resolvedCreatorId = dto.creatorId || tokenCreatorId;

    // Auto-fetch creatorName from User/CompanyUser
    let creatorName = dto.creatorName ?? null;
    if (!creatorName && resolvedCreatorId) {
      const cu = await this.prisma.companyUser.findUnique({
        where: { id: resolvedCreatorId },
        select: { firstName: true, lastName: true },
      });
      if (cu) {
        creatorName = `${cu.firstName} ${cu.lastName ?? ''}`.trim();
      } else {
        const u = await this.prisma.user.findUnique({
          where: { id: resolvedCreatorId },
          select: { fullName: true, firstName: true },
        });
        if (u) creatorName = u.fullName || u.firstName || null;
      }
    }

    // Auto-fetch inchargeName from User/CompanyUser
    let inchargeName = dto.inchargeName ?? null;
    if (dto.inchargeId) {
      if (!inchargeName) {
        const cu = await this.prisma.companyUser.findUnique({
          where: { id: dto.inchargeId },
          select: { firstName: true, lastName: true },
        });
        if (cu) {
          inchargeName = `${cu.firstName} ${cu.lastName ?? ''}`.trim();
        } else {
          const u = await this.prisma.user.findUnique({
            where: { id: dto.inchargeId },
            select: { fullName: true, firstName: true },
          });
          if (u) inchargeName = u.fullName || u.firstName || null;
        }
      }
    } else {
      dto.inchargeId = undefined;
      inchargeName = 'Unassigned';
    }

    // Resolve columnName from columnId
    let columnName: string | null = null;
    if (dto.columnId) {
      const col = await this.prisma.column.findUnique({
        where: { id: dto.columnId },
        select: { label: true },
      });
      columnName = col?.label ?? null;
    }

    // Process content into three formats
    const taskContent = dto.taskContent ?? null;
    const renderedHtml = taskContent ? renderHtml(taskContent) : null;
    const contentPreview = taskContent ? extractPreview(taskContent) : null;

    await this.prisma.projectTask.create({
      data: {
        title: dto.title,
        teamId: dto.teamId,
        companyId,
        creatorId: resolvedCreatorId,
        creatorName,
        columnId: dto.columnId ?? null,
        columnName,
        assignedUserId: dto.userId ?? null,
        inchargeId: dto.inchargeId || null,
        inchargeName,
        priority: dto.priority ?? 'MEDIUM',
        status: dto.status ?? 'TODO',
        logTime: dto.logTime ?? null,
        taskContent,
        renderedHtml,
        contentPreview,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        assignDate: dto.assignDate ? new Date(dto.assignDate) : null,
      } as any,
    });

    // Fire-and-forget: refresh snapshots for this team and affected user
    this.taskVisuals.refreshTeamSnapshots(dto.teamId).catch(() => null);
    this.analyticsSnapshot.refreshTeamSnapshot(dto.teamId).catch(() => null);
    if (resolvedCreatorId) {
      this.taskVisuals.refreshIndividualSnapshots(resolvedCreatorId).catch(() => null);
      this.analyticsSnapshot.refreshUserSnapshot(resolvedCreatorId).catch(() => null);
    }

    return { message: 'Task created successfully' };
  }

  async findAll(dto: ListTasksDto, companyId: string) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (dto.teamId) where.teamId = dto.teamId;
    if (dto.status) where.status = dto.status;
    if (dto.taskId) where.id = dto.taskId;

    for (const filter of dto.filters ?? []) {
      if (filter.type === 'date' && (filter.startDate || filter.endDate)) {
        where.createdAt = {};
        if (filter.startDate) where.createdAt.gte = new Date(filter.startDate);
        if (filter.endDate) where.createdAt.lte = new Date(filter.endDate);
      }
      if (filter.type === 'users' && filter.userId?.length) {
        where.assignedUserId = { in: filter.userId };
      }
    }

    const [tasks, total] = await Promise.all([
      this.prisma.projectTask.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { comments: true } } },
      }),
      this.prisma.projectTask.count({ where }),
    ]);

    return { tasks, meta: { page, limit, total } };
  }

  async findOne(id: string, companyId: string) {
    const where: any = { id };
    if (companyId) where.companyId = companyId;
    const task = await this.prisma.projectTask.findFirst({
      where,
      include: { comments: { where: { parentId: null }, orderBy: { createdAt: 'asc' }, include: { replies: true } } },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async update(
    dto: UpdateTaskDto,
    userId: string,
    companyId: string,
    userPermissions: string[],
  ) {
    const updateWhere: any = { id: dto.taskId };
    if (companyId) updateWhere.companyId = companyId;
    const task = await this.prisma.projectTask.findFirst({ where: updateWhere });
    if (!task) throw new NotFoundException('Task not found');

    const canEdit =
      task.creatorId === userId ||
      userPermissions.includes('task:edit') ||
      userPermissions.includes('task:*');

    if (!canEdit) {
      throw new ForbiddenException('You do not have permission to edit this task');
    }

    // Resolve columnName when columnId changes
    let columnName: string | null | undefined;
    if (dto.columnId !== undefined) {
      if (!dto.columnId) {
        columnName = null;
      } else {
        const col = await this.prisma.column.findUnique({
          where: { id: dto.columnId },
          select: { label: true },
        });
        columnName = col?.label ?? null;
      }
    }

    // Auto-fetch inchargeName when inchargeId changes
    let inchargeName: string | undefined;
    if (dto.inchargeId !== undefined) {
      if (!dto.inchargeId) {
        inchargeName = 'Unassigned';
      } else {
        const cu = await this.prisma.companyUser.findUnique({
          where: { id: dto.inchargeId },
          select: { firstName: true, lastName: true },
        });
        if (cu) {
          inchargeName = `${cu.firstName} ${cu.lastName ?? ''}`.trim();
        } else {
          const u = await this.prisma.user.findUnique({
            where: { id: dto.inchargeId },
            select: { fullName: true, firstName: true },
          });
          if (u) inchargeName = u.fullName || u.firstName || undefined;
        }
      }
    }

    await this.prisma.projectTask.update({
      where: { id: dto.taskId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.columnId !== undefined && {
          columnId: dto.columnId || null,
          columnName: columnName ?? null,
        }),
        ...(dto.inchargeId !== undefined && {
          inchargeId: dto.inchargeId || null,
          inchargeName: inchargeName ?? null,
        }),
        ...(dto.priority && { priority: dto.priority }),
        ...(dto.status && { status: dto.status }),
        ...(dto.logTime !== undefined && { logTime: dto.logTime }),
        ...(dto.taskContent !== undefined && { taskContent: dto.taskContent }),
        ...(dto.dueDate !== undefined && {
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        }),
      } as any,
    });

    // Fire-and-forget: refresh snapshots for this task's team and the acting user
    this.taskVisuals.refreshTeamSnapshots(task.teamId).catch(() => null);
    this.taskVisuals.refreshIndividualSnapshots(userId).catch(() => null);
    this.analyticsSnapshot.refreshTeamSnapshot(task.teamId).catch(() => null);
    this.analyticsSnapshot.refreshUserSnapshot(userId).catch(() => null);

    return { message: 'Task updated successfully' };
  }

  async remove(
    id: string,
    userId: string,
    companyId: string,
    userPermissions: string[],
  ) {
    const removeWhere: any = { id };
    if (companyId) removeWhere.companyId = companyId;
    const task = await this.prisma.projectTask.findFirst({ where: removeWhere });
    if (!task) throw new NotFoundException('Task not found');

    const canDelete =
      task.creatorId === userId ||
      userPermissions.includes('task:delete') ||
      userPermissions.includes('task:*');

    if (!canDelete) {
      throw new ForbiddenException('You do not have permission to delete this task');
    }

    const { teamId, creatorId } = task;
    await this.prisma.comment.deleteMany({ where: { taskId: id } });
    await this.prisma.projectTask.delete({ where: { id } });

    // Fire-and-forget: refresh snapshots after deletion
    this.taskVisuals.refreshTeamSnapshots(teamId).catch(() => null);
    this.taskVisuals.refreshIndividualSnapshots(creatorId).catch(() => null);
    this.analyticsSnapshot.refreshTeamSnapshot(teamId).catch(() => null);
    this.analyticsSnapshot.refreshUserSnapshot(creatorId).catch(() => null);

    return { message: 'Task deleted successfully' };
  }
}
