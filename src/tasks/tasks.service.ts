import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service';
import { EventsGateway } from 'src/gateways/events.gateway';

@Injectable()
export class TasksService {
  constructor(
    private eventsGateway: EventsGateway,
    private prisma: PrismaService,
    private activityLogs: ActivityLogsService,
  ) {}

  async create(dto: CreateTaskDto, userId: string, orgId: string) {
    const taskNumber = `TASK-${Math.floor(1000 + Math.random() * 9000)}`;

    return await this.prisma.$transaction(async (tx) => {
      // 1. Create the Task
      const task = await tx.task.create({
        data: {
          ...dto,
          taskNumber,
          createdById: userId,
          organizationId: orgId,
          dueDate: new Date(dto.dueDate),
        },
      });

      // 2. LOG: Task Creation
      await this.activityLogs.log(
        userId,
        'TASK_CREATED',
        'Task',
        task.id,
        `Created task: ${task.title}`,
      );

      // 3. Notification Logic
      if (dto.assignedToId) {
        await tx.notification.create({
          data: {
            userId: dto.assignedToId,
            title: 'New Task Assigned',
            message: `You have been assigned to task: ${task.title}`,
            type: 'TASK_ASSIGNMENT',
            read: false,
          },
        });
      }

      // Notify the assigned user
      this.eventsGateway.sendToUser(
        dto.assignedToId || '',
        'NEW_NOTIFICATION',
        {
          title: 'New Task Assigned',
          message: `You have been assigned to task: ${task.title}`,
        },
      );

      // Notify the whole organization that a new task exists
      this.eventsGateway.sendToOrg(orgId, 'TASK_CREATED', task);

      return task;
    });
  }

  async findAll(query: {
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, priority, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(priority && { priority }),
    };

    const [items, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { assignedTo: true },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { assignedTo: true, createdBy: true },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  // UPDATED: Added userId to track who is updating the task
  async update(id: string, dto: Partial<CreateTaskDto>, userId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const currentTask = await tx.task.findUnique({ where: { id } });
      if (!currentTask) throw new NotFoundException('Task not found');

      const updatedTask = await tx.task.update({
        where: { id },
        data: {
          ...dto,
          ...(dto.dueDate && { dueDate: new Date(dto.dueDate) }),
        },
      });

      // 1. LOG: Task Update
      // We log which fields were changed for better audit trails
      const changes = Object.keys(dto).join(', ');
      await this.activityLogs.log(
        userId,
        'TASK_UPDATED',
        'Task',
        id,
        `Updated fields: ${changes}`,
      );

      // 2. Notification Logic
      if (dto.assignedToId && dto.assignedToId !== currentTask.assignedToId) {
        await tx.notification.create({
          data: {
            userId: dto.assignedToId,
            title: 'Task Assignment Updated',
            message: `Task "${updatedTask.title}" has been reassigned to you.`,
            type: 'TASK_REASSIGNMENT',
          },
        });
      }
      // Notify the assigned user about the update
      this.eventsGateway.sendToUser(
        dto.assignedToId || currentTask.assignedToId || '',
        'NEW_NOTIFICATION',
        {
          title: 'Task Updated',
          message: `Task "${updatedTask.title}" has been updated.`,
        },
      );

      return updatedTask;
    });
  }

  async remove(id: string, userId: string) {
    try {
      const deletedTask = await this.prisma.task.delete({
        where: { id },
      });

      await this.activityLogs.log(
        userId,
        'TASK_DELETED',
        'Task',
        id,
        `Deleted task: ${deletedTask.title}`,
      );

      return { message: 'Task deleted successfully' };
    } catch (error) {
      throw new NotFoundException('Task not found');
    }
  }
}
