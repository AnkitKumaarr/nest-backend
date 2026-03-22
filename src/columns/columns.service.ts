import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateColumnDto, UpdateColumnDto } from './dto/create-column.dto';

@Injectable()
export class ColumnsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateColumnDto) {
    const label = dto.label;
    const value = label.toLowerCase();
    await this.prisma.column.create({
      data: { name: label, label, value, isDefault: false },
    });
    return { message: 'Column created successfully' };
  }

  async findAll() {
    return this.prisma.column.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async update(dto: UpdateColumnDto) {
    const existing = await this.prisma.column.findUnique({ where: { id: dto.id } });
    if (!existing) throw new NotFoundException('Column not found');
    if (existing.isDefault) throw new ForbiddenException('Default columns cannot be modified');
    const label = dto.label;
    await this.prisma.column.update({
      where: { id: dto.id },
      data: { label, value: label.toLowerCase() },
    });
    return { message: 'Column updated successfully' };
  }

  async remove(id: string) {
    const column = await this.prisma.column.findUnique({ where: { id } });
    if (!column) throw new NotFoundException('Column not found');
    if (column.isDefault) throw new ForbiddenException('Default columns cannot be deleted');
    await this.prisma.column.delete({ where: { id } });
    return { message: 'Column deleted successfully' };
  }
}
