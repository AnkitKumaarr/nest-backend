import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaderService {
  constructor(private prisma: PrismaService) {}

  // Teams where this user is a Technical Leader
  async getLeaderTeams(userId: string, companyId: string) {
    const memberships = await this.prisma.teamMember.findMany({
      where: { userId, roleInTeam: 'Technical Leader' },
      select: { teamId: true },
    });

    const teamIds = memberships.map((m) => m.teamId);
    if (teamIds.length === 0) return [];

    return this.prisma.team.findMany({
      where: { id: { in: teamIds }, companyId },
      include: { _count: { select: { teamMembers: true, projectTasks: true } } },
    });
  }

  // Tasks for teams where user is Technical Leader, with progress stats
  async getLeaderTasks(
    userId: string,
    companyId: string,
    page = 1,
    limit = 50,
  ) {
    const memberships = await this.prisma.teamMember.findMany({
      where: { userId, roleInTeam: 'Technical Leader' },
      select: { teamId: true },
    });

    const teamIds = memberships.map((m) => m.teamId);
    const skip = (page - 1) * limit;

    const where = { teamId: { in: teamIds }, companyId };

    const [tasks, total] = await Promise.all([
      this.prisma.projectTask.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { comments: true } } },
      }),
      this.prisma.projectTask.count({ where }),
    ]);

    // Progress stats per team
    const stats = await Promise.all(
      teamIds.map(async (teamId) => {
        const [total, done, inProgress, review] = await Promise.all([
          this.prisma.projectTask.count({ where: { teamId, companyId } }),
          this.prisma.projectTask.count({
            where: { teamId, companyId, status: 'DONE' },
          }),
          this.prisma.projectTask.count({
            where: { teamId, companyId, status: 'IN_PROGRESS' },
          }),
          this.prisma.projectTask.count({
            where: { teamId, companyId, status: 'REVIEW' },
          }),
        ]);
        return {
          teamId,
          total,
          done,
          inProgress,
          review,
          completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
        };
      }),
    );

    return { tasks, stats, meta: { page, limit, total } };
  }

  // Insights: completion rate, top performers (cached in real prod via Redis)
  async getLeaderInsights(userId: string, companyId: string) {
    const memberships = await this.prisma.teamMember.findMany({
      where: { userId, roleInTeam: 'Technical Leader' },
      select: { teamId: true },
    });

    const teamIds = memberships.map((m) => m.teamId);
    if (teamIds.length === 0) {
      return { completionRate: 0, topPerformers: [], teamInsights: [] };
    }

    const where = { teamId: { in: teamIds }, companyId };

    const [total, done, tasks] = await Promise.all([
      this.prisma.projectTask.count({ where }),
      this.prisma.projectTask.count({ where: { ...where, status: 'DONE' } }),
      this.prisma.projectTask.findMany({
        where: { ...where, status: 'DONE', inchargeId: { not: null } },
        select: { inchargeId: true },
      }),
    ]);

    // Count completed tasks per incharge
    const performerMap: Record<string, number> = {};
    for (const t of tasks) {
      if (t.inchargeId) {
        performerMap[t.inchargeId] = (performerMap[t.inchargeId] ?? 0) + 1;
      }
    }

    // Enrich with user details
    const topPerformerIds = Object.entries(performerMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    const performers = await this.prisma.companyUser.findMany({
      where: { id: { in: topPerformerIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    const topPerformers = topPerformerIds.map((id) => {
      const user = performers.find((p) => p.id === id);
      return { ...user, completedTasks: performerMap[id] };
    });

    // Per-team insights
    const teamInsights = await Promise.all(
      teamIds.map(async (teamId) => {
        const [t, d] = await Promise.all([
          this.prisma.projectTask.count({ where: { teamId, companyId } }),
          this.prisma.projectTask.count({
            where: { teamId, companyId, status: 'DONE' },
          }),
        ]);
        return {
          teamId,
          total: t,
          done: d,
          completionRate: t > 0 ? Math.round((d / t) * 100) : 0,
        };
      }),
    );

    return {
      completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
      topPerformers,
      teamInsights,
    };
  }

  // Team insights (for /teams/:id/insights)
  async getTeamInsights(teamId: string, companyId: string) {
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, companyId },
    });
    if (!team) return null;

    const [total, done, inProgress, review, todo, members] = await Promise.all([
      this.prisma.projectTask.count({ where: { teamId, companyId } }),
      this.prisma.projectTask.count({
        where: { teamId, companyId, status: 'DONE' },
      }),
      this.prisma.projectTask.count({
        where: { teamId, companyId, status: 'IN_PROGRESS' },
      }),
      this.prisma.projectTask.count({
        where: { teamId, companyId, status: 'REVIEW' },
      }),
      this.prisma.projectTask.count({
        where: { teamId, companyId, status: 'TODO' },
      }),
      this.prisma.teamMember.count({ where: { teamId } }),
    ]);

    // Top performers
    const doneTasks = await this.prisma.projectTask.findMany({
      where: { teamId, companyId, status: 'DONE', inchargeId: { not: null } },
      select: { inchargeId: true },
    });

    const performerMap: Record<string, number> = {};
    for (const t of doneTasks) {
      if (t.inchargeId) {
        performerMap[t.inchargeId] = (performerMap[t.inchargeId] ?? 0) + 1;
      }
    }

    const topIds = Object.entries(performerMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);

    const topUsers = await this.prisma.companyUser.findMany({
      where: { id: { in: topIds } },
      select: { id: true, firstName: true, lastName: true },
    });

    const topPerformers = topIds.map((id) => ({
      ...topUsers.find((u) => u.id === id),
      completedTasks: performerMap[id],
    }));

    return {
      teamId,
      teamName: team.name,
      members,
      tasks: { total, todo, inProgress, review, done },
      completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
      topPerformers,
    };
  }
}
