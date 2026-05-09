import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { AnalyticsSnapshotsService } from '../analytics-snapshots/analytics-snapshots.service';

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsSnapshots: AnalyticsSnapshotsService,
  ) {}

  async create(dto: CreateTeamDto, companyId: string) {
    const team = await this.prisma.team.create({
      data: {
        name: dto.name,
        companyId,
        ...(dto.managerId && { managerId: dto.managerId }),
        ...(dto.leadId && { leadId: dto.leadId }),
        ...(dto.createdBy ? { createdBy: dto.createdBy } : {}),
      },
    });

    if (dto.memberIds?.length) {
      const members = await this.prisma.companyUser.findMany({
        where: { id: { in: dto.memberIds }, companyId, isDeleted: false },
        select: { id: true, fullName: true },
      });
      await this.prisma.teamMember.createMany({
        data: members.map((m) => ({
          teamId: team.id,
          teamName: team.name,
          userId: m.id,
          companyId,
          name: m.fullName,
        })),
      });
    }

    this.analyticsSnapshots.refreshTeamSnapshot(team.id).catch(() => null);
    return { message: 'Team created successfully' };
  }

  async listTeams(
    companyId: string,
    _userId: string,
    page = 1,
    limit = 25,
    teamId?: string,
    filters?: { startDate?: string; endDate?: string },
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (companyId) where.companyId = companyId;
    if (teamId) where.id = teamId;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const [data, totalRecords] = await Promise.all([
      this.prisma.team.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { teamMembers: true } } },
      }),
      this.prisma.team.count({ where }),
    ]);

    return { data, meta: { page, limit, totalRecords } };
  }

  async findOne(id: string, _companyId: string) {
    const team = await this.prisma.team.findFirst({
      where: { id },
      include: {
        teamMembers: true,
        _count: { select: { teamMembers: true } },
      },
    });
    if (!team) throw new NotFoundException('Team not found');
    return team;
  }

  async update(id: string, dto: UpdateTeamDto, companyId: string) {
    const team = await this.prisma.team.findFirst({ where: { id } });
    if (!team) throw new NotFoundException('Team not found');

    await this.prisma.team.update({
      where: { id },
      data: {
        name: dto.name,
        ...(dto.managerId !== undefined && { managerId: dto.managerId }),
        ...(dto.leadId !== undefined && { leadId: dto.leadId }),
      },
    });

    if (dto.memberIds !== undefined) {
      await this.prisma.teamMember.deleteMany({ where: { teamId: id } });
      if (dto.memberIds.length) {
        const members = await this.prisma.companyUser.findMany({
          where: { id: { in: dto.memberIds }, companyId, isDeleted: false },
          select: { id: true, fullName: true },
        });
        await this.prisma.teamMember.createMany({
          data: members.map((m) => ({
            teamId: id,
            teamName: dto.name,
            userId: m.id,
            companyId,
            name: m.fullName,
          })),
        });
      }
    }

    this.analyticsSnapshots.refreshTeamSnapshot(id).catch(() => null);
    return { message: 'Team updated successfully' };
  }

  async remove(id: string, _companyId: string) {
    const team = await this.prisma.team.findFirst({ where: { id } });
    if (!team) throw new NotFoundException('Team not found');
    await this.prisma.teamMember.deleteMany({ where: { teamId: id } });
    await this.prisma.team.delete({ where: { id } });
    return { message: 'Team deleted successfully' };
  }
}
