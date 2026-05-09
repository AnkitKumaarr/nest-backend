import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskStatusDto, UpdateTaskStatusDto } from './dto/create-task-status.dto';

@Injectable()
export class TaskStatusService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTaskStatusDto) {
    const label = dto.label;
    const value = label.toLowerCase();
    const last = await this.prisma.taskStatus.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const order = last ? last.order + 1 : 10;
    await this.prisma.taskStatus.create({
      data: { name: label, label, value, isDefault: false, order },
    });
    return { message: 'Status created successfully' };
  }

  async findAll() {
    return this.prisma.taskStatus.findMany({ orderBy: { order: 'asc' } });
  }

  async findOne(id: string) {
    const status = await this.prisma.taskStatus.findUnique({ where: { id } });
    if (!status) throw new NotFoundException('Status not found');
    return status;
  }

  async update(dto: UpdateTaskStatusDto) {
    const existing = await this.prisma.taskStatus.findUnique({ where: { id: dto.id } });
    if (!existing) throw new NotFoundException('Status not found');
    if (existing.isDefault) throw new ForbiddenException('Default statuses cannot be modified');
    const label = dto.label;
    await this.prisma.taskStatus.update({
      where: { id: dto.id },
      data: { label, value: label.toLowerCase() },
    });
    return { message: 'Status updated successfully' };
  }

  async remove(id: string) {
    const existing = await this.prisma.taskStatus.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Status not found');
    if (existing.isDefault) throw new ForbiddenException('Default statuses cannot be deleted');
    await this.prisma.taskStatus.delete({ where: { id } });
    return { message: 'Status deleted successfully' };
  }
}
