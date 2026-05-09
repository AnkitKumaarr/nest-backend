import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRoleDto, companyId: string) {
    await this.prisma.role.create({
      data: { name: dto.name, permissions: dto.permissions, companyId },
    });
    return { message: 'Role created successfully' };
  }

  async findAll(companyId: string) {
    return this.prisma.role.findMany({
      where: {
        OR: [
          { companyId },
          { companyId: null },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const role = await this.prisma.role.findFirst({ where: { id, companyId } });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async remove(id: string, companyId: string) {
    const role = await this.prisma.role.findFirst({ where: { id, companyId } });
    if (!role) throw new NotFoundException('Role not found');
    await this.prisma.role.delete({ where: { id } });
    return { message: 'Role deleted successfully' };
  }

  async update(id: string, dto: CreateRoleDto, companyId: string) {
    const role = await this.prisma.role.findFirst({ where: { id, companyId } });
    if (!role) throw new NotFoundException('Role not found');

    await this.prisma.role.update({
      where: { id },
      data: { name: dto.name, permissions: dto.permissions },
    });
    return { message: 'Role updated successfully' };
  }
}
