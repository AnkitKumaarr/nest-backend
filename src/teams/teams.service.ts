import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { TeamSnapshotService } from '../team-snapshot/team-snapshot.service';

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly teamSnapshot: TeamSnapshotService,
  ) {}

  async create(dto: CreateTeamDto, companyId: string) {
    const team = await this.prisma.team.create({
      data: {
        name: dto.name,
        ...(companyId ? { companyId } : {}),
        ...(dto.createdBy ? { createdBy: dto.createdBy } : {}),
      },
    });
    this.teamSnapshot.refreshTeamSnapshots(team.id).catch(() => null);
    return { message: 'Team created successfully' };
  }

  async listTeams(
    _companyId: string,
    userId: string,
    page = 1,
    limit = 25,
    teamId?: string,
    filters?: { startDate?: string; endDate?: string },
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (userId) where.createdBy = { is: { userId } };
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
      include: { _count: { select: { teamMembers: true } } },
    });
    if (!team) throw new NotFoundException('Team not found');
    return team;
  }

  async update(id: string, name: string, _companyId: string) {
    const team = await this.prisma.team.findFirst({ where: { id } });
    if (!team) throw new NotFoundException('Team not found');
    await this.prisma.team.update({ where: { id }, data: { name } });
    this.teamSnapshot.refreshTeamSnapshots(id).catch(() => null);
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
