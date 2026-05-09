import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectTaskDto } from './dto/create-project-task.dto';
import { ListProjectTasksDto } from './dto/list-project-tasks.dto';
import { UpdateProjectTaskDto } from './dto/update-project-task.dto';
import { renderHtml, extractPreview } from '../common/utils/content.util';
import { TaskSnapshotsService } from '../task-snapshots/task-snapshots.service';
import { AnalyticsSnapshotsService } from '../analytics-snapshots/analytics-snapshots.service';

@Injectable()
export class ProjectTasksService {
  constructor(
    private prisma: PrismaService,
    private taskSnapshots: TaskSnapshotsService,
    private analyticsSnapshots: AnalyticsSnapshotsService,
  ) {}

  async create(dto: CreateProjectTaskDto, tokenCreatorId: string, tokenCompanyId: string) {
    const team = await this.prisma.team.findFirst({ where: { id: dto.teamId } });
    if (!team) throw new NotFoundException('Team not found');
    const companyId = tokenCompanyId || team.companyId;

    if (!companyId) {
      throw new NotFoundException('Company ID not found for team. Please ensure the team is associated with a company.');
    }

    const teamName = dto.teamName ?? team.name ?? null;
    const resolvedCreatorId = dto.creatorId || tokenCreatorId;

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

    const resolvedInChargeId = dto.inChargeId || null;
    let inChargeName: string | null = dto.inChargeName ?? null;
    if (resolvedInChargeId) {
      if (!inChargeName) {
        const cu = await this.prisma.companyUser.findUnique({
          where: { id: resolvedInChargeId },
          select: { firstName: true, lastName: true },
        });
        if (cu) {
          inChargeName = `${cu.firstName} ${cu.lastName ?? ''}`.trim();
        } else {
          const u = await this.prisma.user.findUnique({
            where: { id: resolvedInChargeId },
            select: { fullName: true, firstName: true },
          });
          if (u) inChargeName = u.fullName || u.firstName || null;
        }
      }
    } else {
      inChargeName = null;
    }

    let statusName: string | null = dto.statusName ?? null;
    if (dto.statusId && !statusName) {
      const s = await this.prisma.taskStatus.findUnique({
        where: { id: dto.statusId },
        select: { label: true },
      });
      statusName = s?.label ?? null;
    }

    let priorityName: string | null = dto.priorityName ?? null;
    if (dto.priorityId && !priorityName) {
      const p = await this.prisma.taskPriority.findUnique({
        where: { id: dto.priorityId },
        select: { label: true },
      });
      priorityName = p?.label ?? null;
    }

    let position = 1000;
    const positionWhere: any = { companyId };
    positionWhere.statusId = dto.statusId || null;

    try {
      const lastTask = await this.prisma.projectTask.findFirst({
        where: positionWhere,
        orderBy: { position: 'desc' },
        select: { position: true },
      });
      if (lastTask?.position != null) position = lastTask.position + 1000;
    } catch (error) {
      console.warn('Error getting last task position:', error);
    }

    const taskContentJson = dto.taskContentJson ?? null;
    const renderedHtml = dto.renderedHtml ?? (taskContentJson ? renderHtml(taskContentJson) : null);
    const contentPreview = taskContentJson ? extractPreview(taskContentJson) : null;

    await this.prisma.projectTask.create({
      data: {
        title: dto.title,
        teamId: dto.teamId,
        companyId,
        creatorId: resolvedCreatorId,
        creatorName: creatorName ?? null,
        assignedUserId: dto.userId ?? null,
        inChargeId: resolvedInChargeId,
        inChargeName,
        teamName,
        priorityId: dto.priorityId ?? null,
        priorityName,
        statusId: dto.statusId ?? null,
        statusName,
        logTime: dto.logTime ?? null,
        taskContentJson,
        renderedHtml,
        contentPreview,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        assignDate: dto.assignDate ? new Date(dto.assignDate) : null,
        position,
      } as any,
    });

    this.taskSnapshots.refreshTeamSnapshots(dto.teamId).catch(() => null);
    this.analyticsSnapshots.refreshTeamSnapshot(dto.teamId).catch(() => null);
    if (resolvedCreatorId) {
      this.taskSnapshots.refreshIndividualSnapshots(resolvedCreatorId).catch(() => null);
      this.analyticsSnapshots.refreshUserSnapshot(resolvedCreatorId).catch(() => null);
    }

    return { message: 'Task created successfully' };
  }

  async findAll(dto: ListProjectTasksDto, companyId: string) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: any = { companyId };
    if (dto.teamId) where.teamId = dto.teamId;

    const [tasks, total] = await Promise.all([
      this.prisma.projectTask.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
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
      include: { comments: { orderBy: { createdAt: 'asc' } } },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async update(
    dto: UpdateProjectTaskDto,
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

    let inChargeName: string | null | undefined;
    if (dto.inChargeId !== undefined) {
      if (!dto.inChargeId) {
        inChargeName = null;
      } else {
        const cu = await this.prisma.companyUser.findUnique({
          where: { id: dto.inChargeId },
          select: { firstName: true, lastName: true },
        });
        if (cu) {
          inChargeName = `${cu.firstName} ${cu.lastName ?? ''}`.trim();
        } else {
          const u = await this.prisma.user.findUnique({
            where: { id: dto.inChargeId },
            select: { fullName: true, firstName: true },
          });
          inChargeName = u ? (u.fullName || u.firstName || null) : null;
        }
      }
    }

    let statusName: string | null | undefined = dto.statusName;
    if (dto.statusId !== undefined && dto.statusName === undefined) {
      if (!dto.statusId) {
        statusName = null;
      } else {
        const s = await this.prisma.taskStatus.findUnique({
          where: { id: dto.statusId },
          select: { label: true },
        });
        statusName = s?.label ?? null;
      }
    }

    let priorityName: string | null | undefined = dto.priorityName;
    if (dto.priorityId !== undefined && dto.priorityName === undefined) {
      if (!dto.priorityId) {
        priorityName = null;
      } else {
        const p = await this.prisma.taskPriority.findUnique({
          where: { id: dto.priorityId },
          select: { label: true },
        });
        priorityName = p?.label ?? null;
      }
    }

    await this.prisma.projectTask.update({
      where: { id: dto.taskId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.inChargeId !== undefined && {
          inChargeId: dto.inChargeId || null,
          inChargeName: inChargeName ?? null,
        }),
        ...(dto.priorityId !== undefined && { priorityId: dto.priorityId || null }),
        ...(priorityName !== undefined && { priorityName: priorityName ?? null }),
        ...(dto.statusId !== undefined && { statusId: dto.statusId || null }),
        ...(statusName !== undefined && { statusName: statusName ?? null }),
        ...(dto.logTime !== undefined && { logTime: dto.logTime }),
        ...(dto.taskContentJson !== undefined && {
          taskContentJson: dto.taskContentJson,
          renderedHtml: dto.renderedHtml ?? (dto.taskContentJson ? renderHtml(dto.taskContentJson) : null),
          contentPreview: dto.taskContentJson ? extractPreview(dto.taskContentJson) : null,
        }),
        ...(dto.dueDate !== undefined && {
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        }),
        ...(dto.position !== undefined && { position: dto.position }),
      } as any,
    });

    this.taskSnapshots.refreshTeamSnapshots(task.teamId).catch(() => null);
    this.taskSnapshots.refreshIndividualSnapshots(userId).catch(() => null);
    this.analyticsSnapshots.refreshTeamSnapshot(task.teamId).catch(() => null);
    this.analyticsSnapshots.refreshUserSnapshot(userId).catch(() => null);

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

    this.taskSnapshots.refreshTeamSnapshots(teamId).catch(() => null);
    this.taskSnapshots.refreshIndividualSnapshots(creatorId).catch(() => null);
    this.analyticsSnapshots.refreshTeamSnapshot(teamId).catch(() => null);
    this.analyticsSnapshots.refreshUserSnapshot(creatorId).catch(() => null);

    return { message: 'Task deleted successfully' };
  }
}
