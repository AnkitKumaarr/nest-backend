import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto, ListProjectsDto } from './dto/project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProjectDto, companyId: string, userId: string, userName: string) {
    await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        companyId,
        createdBy: { userId, name: userName },
      },
    });
    return { message: 'Project created successfully' };
  }

  async list(dto: ListProjectsDto, _companyId: string) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 25;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (dto.userId) where.createdBy = { is: { userId: dto.userId } };
    if (dto.teamId) where.teamId = dto.teamId;
    if (dto.filters?.startDate || dto.filters?.endDate) {
      where.createdAt = {};
      if (dto.filters.startDate) where.createdAt.gte = new Date(dto.filters.startDate);
      if (dto.filters.endDate) where.createdAt.lte = new Date(dto.filters.endDate);
    }

    const [data, totalRecords] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.project.count({ where }),
    ]);

    return { data, meta: { page, limit, totalRecords } };
  }

  async update(dto: UpdateProjectDto) {
    const project = await this.prisma.project.findUnique({ where: { id: dto.id } });
    if (!project) throw new NotFoundException('Project not found');

    await this.prisma.project.update({
      where: { id: dto.id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      },
    });
    return { message: 'Project updated successfully' };
  }

  async remove(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    await this.prisma.project.delete({ where: { id } });
    return { message: 'Project deleted successfully' };
  }
}
