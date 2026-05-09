import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddTeamMembersDto, ListTeamMembersDto, UpdateTeamMemberDto } from './dto/team-member.dto';
import { AnalyticsSnapshotsService } from '../analytics-snapshots/analytics-snapshots.service';

@Injectable()
export class TeamMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsSnapshots: AnalyticsSnapshotsService,
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

    this.analyticsSnapshots.refreshTeamSnapshot(dto.teamId).catch(() => null);
    return { message: `${dto.members.length} member(s) added to team` };
  }

  async listMembers(dto: ListTeamMembersDto, _companyId: string, userId: string) {
    const team = await this.prisma.team.findFirst({ where: { id: dto.teamId } });
    if (!team) throw new NotFoundException('Team not found');

    const page = dto.page ?? 1;
    const limit = dto.limit ?? 25;
    const skip = (page - 1) * limit;
    const where: any = { teamId: dto.teamId };

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
    this.analyticsSnapshots.refreshTeamSnapshot(member.teamId).catch(() => null);
    return { message: 'Member removed from team' };
  }

  async updateMember(dto: UpdateTeamMemberDto, _companyId: string) {
    const teamMember = await this.prisma.teamMember.findFirst({
      where: { id: dto.id },
    });
    if (!teamMember) throw new NotFoundException('Team member not found');

    const teamMemberUpdateData: any = {};
    if (dto.roleId !== undefined) teamMemberUpdateData.roleId = dto.roleId;
    if (dto.teamId !== undefined) teamMemberUpdateData.teamId = dto.teamId;
    if (dto.isActive !== undefined) teamMemberUpdateData.isActive = dto.isActive;

    if (dto.teamId) {
      const team = await this.prisma.team.findUnique({
        where: { id: dto.teamId },
        select: { name: true },
      });
      if (!team) throw new NotFoundException('Team not found');
      teamMemberUpdateData.teamName = team.name;
    }

    await this.prisma.teamMember.update({
      where: { id: dto.id },
      data: teamMemberUpdateData,
    });

    if (teamMember.userId) {
      const companyUserUpdateData: any = {};
      if (dto.teamId !== undefined) companyUserUpdateData.teamId = dto.teamId;
      if (dto.roleId !== undefined) {
        companyUserUpdateData.roleId = dto.roleId;
        const role = await this.prisma.role.findUnique({
          where: { id: dto.roleId },
          select: { permissions: true },
        });
        if (role) {
          companyUserUpdateData.permissionsOverride = role.permissions;
        }
      }

      if (Object.keys(companyUserUpdateData).length > 0) {
        await this.prisma.companyUser.update({
          where: { id: teamMember.userId },
          data: companyUserUpdateData,
        });
      }
    }

    if (dto.teamId && dto.teamId !== teamMember.teamId) {
      this.analyticsSnapshots.refreshTeamSnapshot(dto.teamId).catch(() => null);
      if (teamMember.teamId) {
        this.analyticsSnapshots.refreshTeamSnapshot(teamMember.teamId).catch(() => null);
      }
    }

    return { message: 'Team member updated successfully' };
  }
}
