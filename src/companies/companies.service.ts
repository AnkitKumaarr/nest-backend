import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DEFAULT_COLUMNS,
  DEFAULT_STATUSES,
  DEFAULT_PRIORITIES,
  DEFAULT_ROLES,
} from '../common/constants/defaults.constants';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async create(name: string, adminId: string, about?: string) {
    const company = await this.prisma.company.create({
      data: { name, adminId, ...(about && { about }) },
    });
    await this.seedDefaults(company.id);
    return company;
  }

  async findById(id: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async findByAdminId(adminId: string) {
    return this.prisma.company.findFirst({ where: { adminId } });
  }

  private async seedDefaults(companyId: string) {
    await Promise.all([this.seedGlobals(), this.seedRoles(companyId)]);
  }

  private async seedGlobals() {
    const [colCount, statusCount, priorityCount] = await Promise.all([
      this.prisma.column.count(),
      this.prisma.status.count(),
      this.prisma.priority.count(),
    ]);

    const tasks: Promise<any>[] = [];
    if (colCount === 0) tasks.push(this.prisma.column.createMany({ data: DEFAULT_COLUMNS }));
    if (statusCount === 0) tasks.push(this.prisma.status.createMany({ data: DEFAULT_STATUSES }));
    if (priorityCount === 0) tasks.push(this.prisma.priority.createMany({ data: DEFAULT_PRIORITIES }));
    if (tasks.length > 0) await Promise.all(tasks);
  }

  private async seedRoles(companyId: string) {
    await this.prisma.role.createMany({
      data: DEFAULT_ROLES.map((r) => ({ ...r, companyId })),
    });
  }
}
