import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTeamDto, companyId: string, createdBy: string) {
    return this.prisma.team.create({
      data: { name: dto.name, companyId, createdBy },
    });
  }

  async findAll(companyId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [teams, total] = await Promise.all([
      this.prisma.team.findMany({
        where: { companyId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { teamMembers: true } } },
      }),
      this.prisma.team.count({ where: { companyId } }),
    ]);
    return { teams, meta: { page, limit, total } };
  }

  async findOne(id: string, companyId: string) {
    const team = await this.prisma.team.findFirst({
      where: { id, companyId },
      include: { _count: { select: { teamMembers: true } } },
    });
    if (!team) throw new NotFoundException('Team not found');
    return team;
  }

  async update(id: string, name: string, companyId: string) {
    const team = await this.prisma.team.findFirst({ where: { id, companyId } });
    if (!team) throw new NotFoundException('Team not found');
    return this.prisma.team.update({ where: { id }, data: { name } });
  }

  async remove(id: string, companyId: string) {
    const team = await this.prisma.team.findFirst({ where: { id, companyId } });
    if (!team) throw new NotFoundException('Team not found');
    // Cascade delete members and tasks
    await this.prisma.teamMember.deleteMany({ where: { teamId: id } });
    await this.prisma.team.delete({ where: { id } });
    return { message: 'Team deleted successfully' };
  }

  // ── Members ──────────────────────────────────────────────────────────────

  async addMembers(teamId: string, userIds: string[], companyId: string) {
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, companyId },
    });
    if (!team) throw new NotFoundException('Team not found');

    // Fetch company users to get their details
    const users = await this.prisma.companyUser.findMany({
      where: { id: { in: userIds }, companyId, isDeleted: false },
      include: { role: { select: { name: true } } },
    });

    if (users.length === 0) {
      throw new BadRequestException('No valid users found in this company');
    }

    // Skip already-existing members
    const existing = await this.prisma.teamMember.findMany({
      where: { teamId, userId: { in: userIds } },
      select: { userId: true },
    });
    const existingIds = new Set(existing.map((m) => m.userId));

    const toCreate = users
      .filter((u) => !existingIds.has(u.id))
      .map((u) => ({
        teamId,
        userId: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        roleInTeam:
          u.role.name === 'Technical Leader' ? 'Technical Leader' : 'Member',
      }));

    if (toCreate.length > 0) {
      await this.prisma.teamMember.createMany({ data: toCreate });
    }

    return { message: `${toCreate.length} member(s) added to team` };
  }

  async getMembers(teamId: string, companyId: string) {
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, companyId },
    });
    if (!team) throw new NotFoundException('Team not found');

    return this.prisma.teamMember.findMany({
      where: { teamId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async removeMember(teamId: string, userId: string, companyId: string) {
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, companyId },
    });
    if (!team) throw new NotFoundException('Team not found');

    const member = await this.prisma.teamMember.findFirst({
      where: { teamId, userId },
    });
    if (!member) throw new NotFoundException('Member not found in this team');

    await this.prisma.teamMember.delete({ where: { id: member.id } });
    return { message: 'Member removed from team' };
  }
}
