import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async create(name: string, adminId: string) {
    return this.prisma.company.create({
      data: { name, adminId },
    });
  }

  async findById(id: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async findByAdminId(adminId: string) {
    return this.prisma.company.findFirst({ where: { adminId } });
  }
}
