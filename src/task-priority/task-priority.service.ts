import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskPriorityDto, UpdateTaskPriorityDto } from './dto/create-task-priority.dto';

@Injectable()
export class TaskPriorityService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTaskPriorityDto) {
    const label = dto.label;
    const value = label.toLowerCase();
    await this.prisma.taskPriority.create({
      data: { name: label, label, value, isDefault: false },
    });
    return { message: 'Priority created successfully' };
  }

  async findAll() {
    return this.prisma.taskPriority.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async findOne(id: string) {
    const priority = await this.prisma.taskPriority.findUnique({ where: { id } });
    if (!priority) throw new NotFoundException('Priority not found');
    return priority;
  }

  async update(dto: UpdateTaskPriorityDto) {
    const existing = await this.prisma.taskPriority.findUnique({ where: { id: dto.id } });
    if (!existing) throw new NotFoundException('Priority not found');
    if (existing.isDefault) throw new ForbiddenException('Default priorities cannot be modified');
    const label = dto.label;
    await this.prisma.taskPriority.update({
      where: { id: dto.id },
      data: { label, value: label.toLowerCase() },
    });
    return { message: 'Priority updated successfully' };
  }

  async remove(id: string) {
    const existing = await this.prisma.taskPriority.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Priority not found');
    if (existing.isDefault) throw new ForbiddenException('Default priorities cannot be deleted');
    await this.prisma.taskPriority.delete({ where: { id } });
    return { message: 'Priority deleted successfully' };
  }
}
