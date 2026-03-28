import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePriorityDto, UpdatePriorityDto } from './dto/create-priority.dto';

@Injectable()
export class PriorityService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePriorityDto) {
    const label = dto.label;
    const value = label.toLowerCase();
    await this.prisma.priority.create({
      data: { name: label, label, value, isDefault: false },
    });
    return { message: 'Priority created successfully' };
  }

  async findAll() {
    return this.prisma.priority.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async update(dto: UpdatePriorityDto) {
    const existing = await this.prisma.priority.findUnique({ where: { id: dto.id } });
    if (!existing) throw new NotFoundException('Priority not found');
    if (existing.isDefault) throw new ForbiddenException('Default priorities cannot be modified');
    const label = dto.label;
    await this.prisma.priority.update({
      where: { id: dto.id },
      data: { label, value: label.toLowerCase() },
    });
    return { message: 'Priority updated successfully' };
  }

  async remove(id: string) {
    const existing = await this.prisma.priority.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Priority not found');
    if (existing.isDefault) throw new ForbiddenException('Default priorities cannot be deleted');
    await this.prisma.priority.delete({ where: { id } });
    return { message: 'Priority deleted successfully' };
  }
}
