import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddTeamMembersDto, ListTeamMembersDto } from './dto/team-member.dto';

@Injectable()
export class TeamMembersService {
  constructor(private prisma: PrismaService) {}

  async addMembers(dto: AddTeamMembersDto, companyId: string) {
    const team = await this.prisma.team.findFirst({
      where: { id: dto.teamId },
      // where: { id: dto.teamId, companyId },
    });
    if (!team) throw new NotFoundException('Team not found');

    await this.prisma.teamMember.createMany({
      data: dto.members.map((name) => ({
        teamId: dto.teamId,
        teamName: team.name,
        companyId, // required by schema
        name,
        ...(dto.createdBy ? { createdBy: dto.createdBy } : {}),
      })),
    });

    return { message: `${dto.members.length} member(s) added to team` };
  }

  async listMembers(dto: ListTeamMembersDto, _companyId: string, userId: string) {
    // if (!_companyId) return { data: [], meta: { page: dto.page, limit: dto.limit, totalRecords: 0 } };

    const team = await this.prisma.team.findFirst({
      where: { id: dto.teamId },
      // where: { id: dto.teamId, companyId: _companyId },
    });
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
    const member = await this.prisma.teamMember.findFirst({
      where: { id: memberId },
      // where: { id: memberId, companyId: _companyId },
    });
    if (!member) throw new NotFoundException('Member not found');

    await this.prisma.teamMember.delete({ where: { id: memberId } });
    return { message: 'Member removed from team' };
  }
}
