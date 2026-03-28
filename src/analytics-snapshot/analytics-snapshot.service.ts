import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsSnapshotService {
  constructor(private prisma: PrismaService) {}

  // ─── Keys ─────────────────────────────────────────────────────────────────

  private userKey(userId: string)       { return `snapshot_user_${userId}`; }
  private teamKey(teamId: string)       { return `snapshot_team_${teamId}`; }
  private companyKey(companyId: string) { return `snapshot_company_${companyId}`; }

  // ─── Refresh (fire-and-forget) ────────────────────────────────────────────

  async refreshUserSnapshot(userId: string): Promise<void> {
    const snap = await this.computeUserSnapshot(userId);
    await this.prisma.analyticsSnapshot.upsert({
      where: { key: snap.key },
      update: { summary: snap.summary as any, taskBreakdown: snap.taskBreakdown as any, weeklyTaskBreakdown: snap.weeklyTaskBreakdown as any, meetingBreakdown: snap.meetingBreakdown as any, trends: snap.trends as any },
      create: snap as any,
    });
  }

  async refreshTeamSnapshot(teamId: string): Promise<void> {
    const snap = await this.computeTeamSnapshot(teamId);
    await this.prisma.analyticsSnapshot.upsert({
      where: { key: snap.key },
      update: { summary: snap.summary as any, taskBreakdown: snap.taskBreakdown as any, weeklyTaskBreakdown: snap.weeklyTaskBreakdown as any, meetingBreakdown: snap.meetingBreakdown as any, trends: snap.trends as any },
      create: snap as any,
    });
  }

  async refreshCompanySnapshot(companyId: string): Promise<void> {
    const snap = await this.computeCompanySnapshot(companyId);
    await this.prisma.analyticsSnapshot.upsert({
      where: { key: snap.key },
      update: { summary: snap.summary as any, taskBreakdown: snap.taskBreakdown as any, weeklyTaskBreakdown: snap.weeklyTaskBreakdown as any, meetingBreakdown: snap.meetingBreakdown as any, trends: snap.trends as any },
      create: snap as any,
    });
  }

  // ─── GET ──────────────────────────────────────────────────────────────────

  async getUserSnapshot(userId: string) {
    const snap = await this.prisma.analyticsSnapshot.findUnique({ where: { key: this.userKey(userId) } });
    if (snap) return snap;
    await this.refreshUserSnapshot(userId);
    return this.prisma.analyticsSnapshot.findUnique({ where: { key: this.userKey(userId) } });
  }

  async getTeamSnapshot(teamId: string) {
    const snap = await this.prisma.analyticsSnapshot.findUnique({ where: { key: this.teamKey(teamId) } });
    if (snap) return snap;
    await this.refreshTeamSnapshot(teamId);
    return this.prisma.analyticsSnapshot.findUnique({ where: { key: this.teamKey(teamId) } });
  }

  async getCompanySnapshot(companyId: string) {
    const snap = await this.prisma.analyticsSnapshot.findUnique({ where: { key: this.companyKey(companyId) } });
    if (snap) return snap;
    await this.refreshCompanySnapshot(companyId);
    return this.prisma.analyticsSnapshot.findUnique({ where: { key: this.companyKey(companyId) } });
  }

  // ─── Compute: User ────────────────────────────────────────────────────────

  private async computeUserSnapshot(userId: string) {
    const taskWhere = { OR: [{ creatorId: userId }, { assignedUserId: userId }, { inchargeId: userId }] };
    const meetingWhere = { OR: [{ createdBy: userId }, { participants: { some: { userId } } }] };

    const [
      taskByStatus,
      taskByPriority,
      weeklyByStatus,
      weeklyByPriority,
      meetings,
      recentCompleted,
      taskTrend,
      meetingTrend,
    ] = await Promise.all([
      this.prisma.projectTask.groupBy({ by: ['status'], where: taskWhere, _count: { id: true } }),
      this.prisma.projectTask.groupBy({ by: ['priority'], where: taskWhere, _count: { id: true } }),
      this.prisma.weekTask.groupBy({ by: ['status'], where: { userId }, _count: { id: true } }),
      this.prisma.weekTask.groupBy({ by: ['priority'], where: { userId }, _count: { id: true } }),
      this.prisma.meeting.findMany({ where: meetingWhere, select: { startTime: true, endTime: true, status: true } }),
      this.prisma.projectTask.count({ where: { ...taskWhere, status: 'COMPLETED', updatedAt: { gte: this.daysAgo(7) } } }),
      this.prisma.projectTask.findMany({ where: { ...taskWhere, status: 'COMPLETED', updatedAt: { gte: this.daysAgo(30) } }, select: { updatedAt: true } }),
      this.prisma.meeting.findMany({ where: { ...meetingWhere, startTime: { gte: this.daysAgo(30) } }, select: { startTime: true } }),
    ]);

    const totalTasks   = taskByStatus.reduce((a, s) => a + s._count.id, 0);
    const completed    = taskByStatus.find((s) => s.status === 'COMPLETED')?._count.id ?? 0;
    const overdue      = await this.prisma.projectTask.count({ where: { ...taskWhere, dueDate: { lt: new Date() }, NOT: { status: 'COMPLETED' } } });
    const { totalHours, avgDuration, byStatus: meetingByStatus } = this.computeMeetingStats(meetings);
    const upcomingMeetings = meetings.filter((m) => m.startTime > new Date() && m.status !== 'cancelled').length;

    const totalWeekly    = weeklyByStatus.reduce((a, s) => a + s._count.id, 0);
    const completedWeekly = weeklyByStatus.find((s) => ['done', 'COMPLETED', 'completed'].includes(s.status))?._count.id ?? 0;

    return {
      key: this.userKey(userId),
      scope: 'user',
      scopeId: userId,
      summary: {
        totalProjectTasks: totalTasks,
        completedProjectTasks: completed,
        overdueProjectTasks: overdue,
        inProgressProjectTasks: taskByStatus.find((s) => s.status === 'IN_PROGRESS')?._count.id ?? 0,
        completionRate: totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0,
        overdueRate: totalTasks > 0 ? Math.round((overdue / totalTasks) * 100) : 0,
        recentlyCompletedLast7Days: recentCompleted,
        totalWeeklyTasks: totalWeekly,
        completedWeeklyTasks: completedWeekly,
        totalMeetings: meetings.length,
        upcomingMeetings,
        meetingHoursTotal: totalHours,
        avgMeetingDurationMinutes: avgDuration,
        productivityScore: this.productivityScore(completed, totalTasks, overdue, avgDuration),
      },
      taskBreakdown: {
        byStatus: taskByStatus.map((s) => ({ status: s.status, count: s._count.id })),
        byPriority: taskByPriority.map((p) => ({ priority: p.priority, count: p._count.id })),
        recentlyCompleted: recentCompleted,
        avgResolutionDays: await this.avgResolutionDays(taskWhere),
      },
      weeklyTaskBreakdown: {
        byStatus: weeklyByStatus.map((s) => ({ status: s.status, count: s._count.id })),
        byPriority: weeklyByPriority.map((p) => ({ priority: p.priority, count: p._count.id })),
        totalThisWeek: totalWeekly,
        completedThisWeek: completedWeekly,
      },
      meetingBreakdown: {
        byStatus: meetingByStatus,
        avgDurationMinutes: avgDuration,
        totalHours,
        upcomingCount: upcomingMeetings,
        participationRate: meetings.length > 0 ? 100 : 0,
      },
      trends: {
        taskCompletion: this.groupByDay(taskTrend.map((t) => t.updatedAt)),
        meetingFrequency: this.groupByDay(meetingTrend.map((m) => m.startTime)),
      },
    };
  }

  // ─── Compute: Team ────────────────────────────────────────────────────────

  private async computeTeamSnapshot(teamId: string) {
    const [
      taskByStatus,
      taskByPriority,
      workload,
      recentCompleted,
      overdue,
      taskTrend,
    ] = await Promise.all([
      this.prisma.projectTask.groupBy({ by: ['status'], where: { teamId }, _count: { id: true } }),
      this.prisma.projectTask.groupBy({ by: ['priority'], where: { teamId }, _count: { id: true } }),
      this.prisma.projectTask.groupBy({ by: ['inchargeId', 'inchargeName'], where: { teamId, NOT: { inchargeId: null } }, _count: { id: true }, orderBy: { _count: { id: 'desc' } } }),
      this.prisma.projectTask.count({ where: { teamId, status: 'COMPLETED', updatedAt: { gte: this.daysAgo(7) } } }),
      this.prisma.projectTask.count({ where: { teamId, dueDate: { lt: new Date() }, NOT: { status: 'COMPLETED' } } }),
      this.prisma.projectTask.findMany({ where: { teamId, status: 'COMPLETED', updatedAt: { gte: this.daysAgo(30) } }, select: { updatedAt: true } }),
    ]);

    const totalTasks = taskByStatus.reduce((a, s) => a + s._count.id, 0);
    const completed  = taskByStatus.find((s) => s.status === 'COMPLETED')?._count.id ?? 0;

    return {
      key: this.teamKey(teamId),
      scope: 'team',
      scopeId: teamId,
      summary: {
        totalProjectTasks: totalTasks,
        completedProjectTasks: completed,
        overdueProjectTasks: overdue,
        inProgressProjectTasks: taskByStatus.find((s) => s.status === 'IN_PROGRESS')?._count.id ?? 0,
        completionRate: totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0,
        overdueRate: totalTasks > 0 ? Math.round((overdue / totalTasks) * 100) : 0,
        recentlyCompletedLast7Days: recentCompleted,
        totalWeeklyTasks: 0,
        completedWeeklyTasks: 0,
        totalMeetings: 0,
        upcomingMeetings: 0,
        meetingHoursTotal: 0,
        avgMeetingDurationMinutes: 0,
        productivityScore: this.productivityScore(completed, totalTasks, overdue, 0),
      },
      taskBreakdown: {
        byStatus: taskByStatus.map((s) => ({ status: s.status, count: s._count.id })),
        byPriority: taskByPriority.map((p) => ({ priority: p.priority, count: p._count.id })),
        recentlyCompleted: recentCompleted,
        avgResolutionDays: await this.avgResolutionDays({ teamId }),
        workloadPerMember: workload.map((w) => ({ name: w.inchargeName ?? 'Unknown', count: w._count.id })),
      },
      weeklyTaskBreakdown: { byStatus: [], byPriority: [], totalThisWeek: 0, completedThisWeek: 0 },
      meetingBreakdown: { byStatus: [], avgDurationMinutes: 0, totalHours: 0, upcomingCount: 0, participationRate: 0 },
      trends: {
        taskCompletion: this.groupByDay(taskTrend.map((t) => t.updatedAt)),
        meetingFrequency: {},
      },
    };
  }

  // ─── Compute: Company ─────────────────────────────────────────────────────

  private async computeCompanySnapshot(companyId: string) {
    const [
      taskByStatus,
      taskByPriority,
      meetings,
      weeklyByStatus,
      recentCompleted,
      overdue,
      taskTrend,
      meetingTrend,
    ] = await Promise.all([
      this.prisma.projectTask.groupBy({ by: ['status'], where: { companyId }, _count: { id: true } }),
      this.prisma.projectTask.groupBy({ by: ['priority'], where: { companyId }, _count: { id: true } }),
      this.prisma.meeting.findMany({ where: { companyId }, select: { startTime: true, endTime: true, status: true } }),
      this.prisma.weekTask.groupBy({ by: ['status'], where: { companyId }, _count: { id: true } }),
      this.prisma.projectTask.count({ where: { companyId, status: 'COMPLETED', updatedAt: { gte: this.daysAgo(7) } } }),
      this.prisma.projectTask.count({ where: { companyId, dueDate: { lt: new Date() }, NOT: { status: 'COMPLETED' } } }),
      this.prisma.projectTask.findMany({ where: { companyId, status: 'COMPLETED', updatedAt: { gte: this.daysAgo(30) } }, select: { updatedAt: true } }),
      this.prisma.meeting.findMany({ where: { companyId, startTime: { gte: this.daysAgo(30) } }, select: { startTime: true } }),
    ]);

    const totalTasks = taskByStatus.reduce((a, s) => a + s._count.id, 0);
    const completed  = taskByStatus.find((s) => s.status === 'COMPLETED')?._count.id ?? 0;
    const { totalHours, avgDuration, byStatus: meetingByStatus } = this.computeMeetingStats(meetings);
    const upcomingMeetings = meetings.filter((m) => m.startTime > new Date() && m.status !== 'cancelled').length;

    const totalWeekly     = weeklyByStatus.reduce((a, s) => a + s._count.id, 0);
    const completedWeekly = weeklyByStatus.find((s) => ['done', 'COMPLETED', 'completed'].includes(s.status))?._count.id ?? 0;

    return {
      key: this.companyKey(companyId),
      scope: 'company',
      scopeId: companyId,
      summary: {
        totalProjectTasks: totalTasks,
        completedProjectTasks: completed,
        overdueProjectTasks: overdue,
        inProgressProjectTasks: taskByStatus.find((s) => s.status === 'IN_PROGRESS')?._count.id ?? 0,
        completionRate: totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0,
        overdueRate: totalTasks > 0 ? Math.round((overdue / totalTasks) * 100) : 0,
        recentlyCompletedLast7Days: recentCompleted,
        totalWeeklyTasks: totalWeekly,
        completedWeeklyTasks: completedWeekly,
        totalMeetings: meetings.length,
        upcomingMeetings,
        meetingHoursTotal: totalHours,
        avgMeetingDurationMinutes: avgDuration,
        productivityScore: this.productivityScore(completed, totalTasks, overdue, avgDuration),
      },
      taskBreakdown: {
        byStatus: taskByStatus.map((s) => ({ status: s.status, count: s._count.id })),
        byPriority: taskByPriority.map((p) => ({ priority: p.priority, count: p._count.id })),
        recentlyCompleted: recentCompleted,
        avgResolutionDays: await this.avgResolutionDays({ companyId }),
      },
      weeklyTaskBreakdown: {
        byStatus: weeklyByStatus.map((s) => ({ status: s.status, count: s._count.id })),
        byPriority: [],
        totalThisWeek: totalWeekly,
        completedThisWeek: completedWeekly,
      },
      meetingBreakdown: {
        byStatus: meetingByStatus,
        avgDurationMinutes: avgDuration,
        totalHours,
        upcomingCount: upcomingMeetings,
        participationRate: 0,
      },
      trends: {
        taskCompletion: this.groupByDay(taskTrend.map((t) => t.updatedAt)),
        meetingFrequency: this.groupByDay(meetingTrend.map((m) => m.startTime)),
      },
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private daysAgo(n: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
  }

  private groupByDay(dates: Date[]): Record<string, number> {
    const result: Record<string, number> = {};
    for (const d of dates) {
      const key = d.toISOString().slice(0, 10);
      result[key] = (result[key] ?? 0) + 1;
    }
    return result;
  }

  private computeMeetingStats(meetings: { startTime: Date; endTime: Date; status: string }[]) {
    const totalMins = meetings.reduce(
      (acc, m) => acc + (m.endTime.getTime() - m.startTime.getTime()) / 60000,
      0,
    );
    const totalHours    = parseFloat((totalMins / 60).toFixed(1));
    const avgDuration   = meetings.length > 0 ? Math.round(totalMins / meetings.length) : 0;
    const statusMap: Record<string, number> = {};
    for (const m of meetings) {
      statusMap[m.status] = (statusMap[m.status] ?? 0) + 1;
    }
    const byStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));
    return { totalHours, avgDuration, byStatus };
  }

  private async avgResolutionDays(where: any): Promise<number> {
    const tasks = await this.prisma.projectTask.findMany({
      where: { ...where, status: 'COMPLETED', createdAt: { gte: this.daysAgo(90) } },
      select: { createdAt: true, updatedAt: true },
    });
    if (!tasks.length) return 0;
    const total = tasks.reduce((acc, t) => {
      return acc + (t.updatedAt.getTime() - t.createdAt.getTime()) / 86400000;
    }, 0);
    return parseFloat((total / tasks.length).toFixed(1));
  }

  /** Weighted productivity score 0–100 */
  private productivityScore(completed: number, total: number, overdue: number, avgMeetingMins: number): number {
    if (total === 0) return 0;
    const completionRate = (completed / total) * 60;          // max 60 pts
    const overdueDeduction = Math.min((overdue / total) * 30, 30); // max -30 pts
    const meetingBonus = avgMeetingMins > 0 && avgMeetingMins <= 60 ? 10 : 0; // 10 pts for healthy meeting length
    return Math.max(0, Math.round(completionRate - overdueDeduction + meetingBonus));
  }
}
