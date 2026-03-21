import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRoleDto, companyId: string) {
    return this.prisma.role.create({
      data: {
        name: dto.name,
        permissions: dto.permissions,
        companyId,
      },
    });
  }

  async findAll(companyId: string) {
    return this.prisma.role.findMany({
      where: { companyId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(id: string, dto: CreateRoleDto, companyId: string) {
    const role = await this.prisma.role.findFirst({ where: { id, companyId } });
    if (!role) throw new NotFoundException('Role not found');

    return this.prisma.role.update({
      where: { id },
      data: { name: dto.name, permissions: dto.permissions },
    });
  }
}
