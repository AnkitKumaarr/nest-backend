import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStatusDto, UpdateStatusDto } from './dto/create-status.dto';

@Injectable()
export class StatusService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateStatusDto) {
    const label = dto.label;
    const value = label.toLowerCase();
    await this.prisma.status.create({
      data: { name: label, label, value, isDefault: false },
    });
    return { message: 'Status created successfully' };
  }

  async findAll() {
    return this.prisma.status.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async update(dto: UpdateStatusDto) {
    const existing = await this.prisma.status.findUnique({ where: { id: dto.id } });
    if (!existing) throw new NotFoundException('Status not found');
    if (existing.isDefault) throw new ForbiddenException('Default statuses cannot be modified');
    const label = dto.label;
    await this.prisma.status.update({
      where: { id: dto.id },
      data: { label, value: label.toLowerCase() },
    });
    return { message: 'Status updated successfully' };
  }

  async remove(id: string) {
    const existing = await this.prisma.status.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Status not found');
    if (existing.isDefault) throw new ForbiddenException('Default statuses cannot be deleted');
    await this.prisma.status.delete({ where: { id } });
    return { message: 'Status deleted successfully' };
  }
}
