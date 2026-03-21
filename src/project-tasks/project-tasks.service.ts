import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectTaskDto } from './dto/create-project-task.dto';

@Injectable()
export class ProjectTasksService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProjectTaskDto, creatorId: string, companyId: string) {
    // Verify team belongs to this company
    const team = await this.prisma.team.findFirst({
      where: { id: dto.teamId, companyId },
    });
    if (!team) throw new NotFoundException('Team not found in this company');

    return this.prisma.projectTask.create({
      data: {
        title: dto.title,
        teamId: dto.teamId,
        companyId,
        creatorId,
        inchargeId: dto.inchargeId ?? null,
        priority: dto.priority ?? 'MEDIUM',
        status: dto.status ?? 'TODO',
        logTime: dto.logTime ?? null,
        taskContent: dto.taskContent ?? null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
    });
  }

  async findAll(
    companyId: string,
    teamId?: string,
    status?: string,
    page = 1,
    limit = 50,
  ) {
    const skip = (page - 1) * limit;
    const where: any = { companyId };
    if (teamId) where.teamId = teamId;
    if (status) where.status = status;

    const [tasks, total] = await Promise.all([
      this.prisma.projectTask.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { comments: true } },
        },
      }),
      this.prisma.projectTask.count({ where }),
    ]);

    return { tasks, meta: { page, limit, total } };
  }

  async findOne(id: string, companyId: string) {
    const task = await this.prisma.projectTask.findFirst({
      where: { id, companyId },
      include: { comments: { orderBy: { createdAt: 'asc' } } },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async update(
    id: string,
    dto: Partial<CreateProjectTaskDto>,
    userId: string,
    companyId: string,
    userPermissions: string[],
  ) {
    const task = await this.prisma.projectTask.findFirst({
      where: { id, companyId },
    });
    if (!task) throw new NotFoundException('Task not found');

    const isCreator = task.creatorId === userId;
    const canEdit =
      isCreator ||
      userPermissions.includes('task:edit') ||
      userPermissions.includes('task:*');

    if (!canEdit) {
      throw new ForbiddenException('You do not have permission to edit this task');
    }

    return this.prisma.projectTask.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.inchargeId !== undefined && { inchargeId: dto.inchargeId }),
        ...(dto.priority && { priority: dto.priority }),
        ...(dto.status && { status: dto.status }),
        ...(dto.logTime !== undefined && { logTime: dto.logTime }),
        ...(dto.taskContent !== undefined && { taskContent: dto.taskContent }),
        ...(dto.dueDate !== undefined && {
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        }),
      },
    });
  }

  async remove(
    id: string,
    userId: string,
    companyId: string,
    userPermissions: string[],
  ) {
    const task = await this.prisma.projectTask.findFirst({
      where: { id, companyId },
    });
    if (!task) throw new NotFoundException('Task not found');

    const isCreator = task.creatorId === userId;
    const canDelete =
      isCreator ||
      userPermissions.includes('task:delete') ||
      userPermissions.includes('task:*');

    if (!canDelete) {
      throw new ForbiddenException('You do not have permission to delete this task');
    }

    await this.prisma.projectTaskComment.deleteMany({ where: { taskId: id } });
    await this.prisma.projectTask.delete({ where: { id } });
    return { message: 'Task deleted successfully' };
  }

  // ── Comments ──────────────────────────────────────────────────────────────

  async addComment(
    taskId: string,
    comment: string,
    userId: string,
    username: string,
    companyId: string,
  ) {
    const task = await this.prisma.projectTask.findFirst({
      where: { id: taskId, companyId },
    });
    if (!task) throw new NotFoundException('Task not found');

    return this.prisma.projectTaskComment.create({
      data: { taskId, comment, userId, username },
    });
  }

  async getComments(taskId: string, companyId: string, page = 1, limit = 20) {
    const task = await this.prisma.projectTask.findFirst({
      where: { id: taskId, companyId },
    });
    if (!task) throw new NotFoundException('Task not found');

    const skip = (page - 1) * limit;
    const [comments, total] = await Promise.all([
      this.prisma.projectTaskComment.findMany({
        where: { taskId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.projectTaskComment.count({ where: { taskId } }),
    ]);

    return { comments, meta: { page, limit, total } };
  }
}
