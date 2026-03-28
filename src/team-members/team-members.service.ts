import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddTeamMembersDto, ListTeamMembersDto } from './dto/team-member.dto';
import { TeamSnapshotService } from '../team-snapshot/team-snapshot.service';

@Injectable()
export class TeamMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly teamSnapshot: TeamSnapshotService,
  ) {}

  async addMembers(dto: AddTeamMembersDto, companyId: string) {
    const team = await this.prisma.team.findFirst({ where: { id: dto.teamId } });
    if (!team) throw new NotFoundException('Team not found');

    await this.prisma.teamMember.createMany({
      data: dto.members.map((name) => ({
        teamId: dto.teamId,
        teamName: team.name,
        ...(companyId ? { companyId } : {}),
        name,
        ...(dto.createdBy ? { createdBy: dto.createdBy } : {}),
      })),
    });

    this.teamSnapshot.refreshTeamSnapshots(dto.teamId).catch(() => null);
    return { message: `${dto.members.length} member(s) added to team` };
  }

  async listMembers(dto: ListTeamMembersDto, _companyId: string, userId: string) {
    const team = await this.prisma.team.findFirst({ where: { id: dto.teamId } });
    if (!team) throw new NotFoundException('Team not found');

    const page = dto.page ?? 1;
    const limit = dto.limit ?? 25;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (userId) where.createdBy = { is: { userId } };

    if (dto.filters?.startDate || dto.filters?.endDate) {
      where.createdAt = {};
      if (dto.filters.startDate) where.createdAt.gte = new Date(dto.filters.startDate);
      if (dto.filters.endDate) where.createdAt.lte = new Date(dto.filters.endDate);
    }

    const [data, totalRecords] = await Promise.all([
      this.prisma.teamMember.findMany({ where, skip, take: limit, orderBy: { createdAt: 'asc' } }),
      this.prisma.teamMember.count({ where }),
    ]);

    return { data, meta: { page, limit, totalRecords } };
  }

  async removeMember(memberId: string, _companyId: string) {
    const member = await this.prisma.teamMember.findFirst({ where: { id: memberId } });
    if (!member) throw new NotFoundException('Member not found');

    await this.prisma.teamMember.delete({ where: { id: memberId } });
    this.teamSnapshot.refreshTeamSnapshots(member.teamId).catch(() => null);
    return { message: 'Member removed from team' };
  }
}
