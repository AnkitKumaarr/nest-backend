import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsGateway } from '../gateways/events.gateway';
import dayjs from 'dayjs';

@Injectable()
export class TasksService {
  constructor(
    private eventsGateway: EventsGateway,
    private prisma: PrismaService,
    private activityLogs: ActivityLogsService,
  ) {}

  /**
   * Convert date string from DD-MM-YYYY format to UTC Date string
   */
  private convertToUTC(dateString?: string): string {
    if (!dateString) return new Date().toISOString();

    // Create Date object in UTC
    const date = new Date();

    return date.toISOString();
  }

  async create(dto: CreateTaskDto, userId: string, orgId: string) {
    return await this.prisma.$transaction(async (tx) => {
      // Generate createdDay from date if provided
      let createdDay: string | undefined;
      if (dto.date) {
        createdDay = dayjs(dto.date).format('dddd');
      }

      // 1. Create the Task
      const task = await tx.task.create({
        data: {
          title: dto.title,
          description: dto.description,
          date: this.convertToUTC(dto?.date),
          dueDate: this.convertToUTC(dto?.dueDate),
          createdDay: createdDay,
          priority: dto.priority || 'medium',
          status: dto.status || 'pending',
          blocker: dto.blocker,
          assignedTo: dto?.assignedToId || null,
          createdBy: userId,
          companyId: orgId || null,
          groupId: dto?.groupId || null,
        },
      });

      // 2. LOG: Task Creation
      await this.activityLogs.log(
        tx, // Pass the transaction client
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

  async getTasks(userId: string) {
    const tasks = await this.prisma.task.findMany({
      where: {
        OR: [{ createdBy: userId }, { assignedTo: userId }],
      },
      orderBy: { createdAt: 'desc' },
    });

    return tasks;
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
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  // UPDATED: Added userId to track who is updating the task
  async update(taskId: string, dto: UpdateTaskDto, userId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const currentTask = await tx.task.findUnique({ where: { id: taskId } });
      if (!currentTask) throw new NotFoundException('Task not found');

      // Extract taskId from dto and create updateData without it
      const { taskId: _, ...updateFields } = dto;
      const updateData: any = { ...updateFields };

      // Handle date conversions
      if (dto.date) {
        updateData.date = this.convertToUTC(dto.date);
      }
      if (dto.dueDate) {
        updateData.dueDate = this.convertToUTC(dto.dueDate);
      }

      // Handle relation updates
      if (dto.assignedToId) {
        updateData.assignedTo = { connect: { id: dto.assignedToId } };
      }

      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: updateData,
      });

      // 1. LOG: Task Update
      // We log which fields were changed for better audit trails
      const changes = Object.keys(updateFields).join(', ');
      await this.activityLogs.log(
        tx, // Pass the transaction client
        userId,
        'TASK_UPDATED',
        'Task',
        taskId,
        `Updated fields: ${changes}`,
      );

      // 2. Notification Logic
      if (dto.assignedToId && dto.assignedToId !== currentTask.assignedTo) {
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
        dto.assignedToId || currentTask.assignedTo || '',
        'NEW_NOTIFICATION',
        {
          title: 'Task Updated',
          message: `Task "${updatedTask.title}" has been updated.`,
        },
      );

      return updatedTask;
    });
  }

  async remove(taskId: string, userId: string) {
    try {
      const deletedTask = await this.prisma.$transaction(async (tx) => {
        const deletedTask = await tx.task.delete({
          where: { id: taskId },
        });
        return deletedTask;
      });

      await this.activityLogs.log(
        this.prisma, // Pass the regular prisma client (not in transaction)
        userId,
        'TASK_DELETED',
        'Task',
        taskId,
        `Deleted task: ${deletedTask.title}`,
      );

      return { message: 'Task deleted successfully' };
    } catch (error) {
      throw new NotFoundException('Task not found');
    }
  }
}
