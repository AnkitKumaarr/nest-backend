import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// ─── Chart Types ─────────────────────────────────────────────────────────────

type SnapshotType =
  | 'member_count'
  | 'task_status'
  | 'task_priority'
  | 'workload'
  | 'completion_trend'
  | 'member_growth';

const ALL_TYPES: SnapshotType[] = [
  'member_count',
  'task_status',
  'task_priority',
  'workload',
  'completion_trend',
  'member_growth',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function groupByDay(dates: Date[]): { date: string; count: number }[] {
  const map: Record<string, number> = {};
  for (const d of dates) {
    const key = d.toISOString().slice(0, 10);
    map[key] = (map[key] ?? 0) + 1;
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class TeamSnapshotService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Key builder ─────────────────────────────────────────────────────────────

  private key(type: SnapshotType, teamId: string): string {
    return `team_${type}_${teamId}`;
  }

  // ── Refresh: fire-and-forget, called on any team/member mutation ─────────────

  async refreshTeamSnapshots(teamId: string): Promise<void> {
    const snapshots = await Promise.all(
      ALL_TYPES.map((type) => this.compute(type, teamId)),
    );

    await Promise.all(
      snapshots.map((snap) =>
        this.prisma.teamSnapshot.upsert({
          where: { key: snap.key },
          update: { title: snap.title, chartType: snap.chartType, data: snap.data as any, isActive: true },
          create: snap as any,
        }),
      ),
    );
  }

  // ── GET: single chart (snapshot-first, compute on miss) ─────────────────────

  async getSnapshot(type: SnapshotType, teamId: string) {
    const existing = await this.prisma.teamSnapshot.findUnique({
      where: { key: this.key(type, teamId) },
    });
    if (existing) return existing;

    const computed = await this.compute(type, teamId);
    await this.prisma.teamSnapshot.upsert({
      where: { key: computed.key },
      update: { data: computed.data as any },
      create: computed as any,
    });
    return computed;
  }

  // ── GET: all charts for a team in one response ───────────────────────────────

  async getAllSnapshots(teamId: string) {
    const stored = await this.prisma.teamSnapshot.findMany({
      where: { teamId, isActive: true },
    });

    // If all snapshots present, return them
    if (stored.length === ALL_TYPES.length) {
      return this.indexByType(stored);
    }

    // Otherwise compute all and store
    await this.refreshTeamSnapshots(teamId);
    const fresh = await this.prisma.teamSnapshot.findMany({
      where: { teamId, isActive: true },
    });
    return this.indexByType(fresh);
  }

  private indexByType(snaps: any[]): Record<string, any> {
    return Object.fromEntries(snaps.map((s) => [s.type, s]));
  }

  // ── Core compute dispatcher ──────────────────────────────────────────────────

  private async compute(type: SnapshotType, teamId: string) {
    const result = await this.aggregate(type, teamId);
    return {
      key: this.key(type, teamId),
      title: result.title,
      type,
      teamId,
      chartType: result.chartType,
      data: result.data,
      isActive: true,
    };
  }

  private aggregate(type: SnapshotType, teamId: string) {
    switch (type) {
      case 'member_count':       return this.computeMemberCount(teamId);
      case 'task_status':        return this.computeTaskStatus(teamId);
      case 'task_priority':      return this.computeTaskPriority(teamId);
      case 'workload':           return this.computeWorkload(teamId);
      case 'completion_trend':   return this.computeCompletionTrend(teamId);
      case 'member_growth':      return this.computeMemberGrowth(teamId);
    }
  }

  // ── 1. Member Count ─────────────────────────────────────────────────────────
  // Single KPI card: total members in the team.

  private async computeMemberCount(teamId: string) {
    const total = await this.prisma.teamMember.count({ where: { teamId } });
    return {
      title: 'Team Member Count',
      chartType: 'stat',
      data: { total },
    };
  }

  // ── 2. Task Status Distribution ─────────────────────────────────────────────
  // Bar chart: how many tasks are in each status for this team.

  private async computeTaskStatus(teamId: string) {
    const groups = await this.prisma.projectTask.groupBy({
      by: ['statusName'],
      where: { teamId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
    return {
      title: 'Team Task Status',
      chartType: 'bar',
      data: {
        labels: groups.map((g) => g.statusName || 'Unknown'),
        datasets: [{ label: 'Tasks', data: groups.map((g) => (g._count as any).id || 0) }],
      },
    };
  }

  // ── 3. Task Priority Breakdown ───────────────────────────────────────────────
  // Pie chart: task distribution across priority levels.

  private async computeTaskPriority(teamId: string) {
    const groups = await this.prisma.projectTask.groupBy({
      by: ['priorityName'],
      where: { teamId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
    return {
      title: 'Team Task Priority Breakdown',
      chartType: 'pie',
      data: {
        labels: groups.map((g) => g.priorityName || 'Unknown'),
        datasets: [{ label: 'Tasks by Priority', data: groups.map((g) => (g._count as any).id || 0) }],
      },
    };
  }

  // ── 4. Workload Per Member ───────────────────────────────────────────────────
  // Bar chart: open task count assigned to each team member by name.

  private async computeWorkload(teamId: string) {
    const groups = await this.prisma.projectTask.groupBy({
      by: ['inChargeId', 'inChargeName'],
      where: { teamId, NOT: [{ inChargeId: null }, { statusName: 'COMPLETED' }] },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
    return {
      title: 'Team Workload Distribution',
      chartType: 'bar',
      data: {
        labels: groups.map((g) => g.inChargeName ?? 'Unassigned'),
        datasets: [{ label: 'Open Tasks', data: groups.map((g) => (g._count as any).id || 0) }],
      },
    };
  }

  // ── 5. Completion Trend ─────────────────────────────────────────────────────
  // Line chart: completed tasks per day over the last 30 days.

  private async computeCompletionTrend(teamId: string) {
    const tasks = await this.prisma.projectTask.findMany({
      where: {
        teamId,
        statusName: 'COMPLETED',
        updatedAt: { gte: daysAgo(30) },
      },
      select: { updatedAt: true },
      orderBy: { updatedAt: 'asc' },
    });
    const trend = groupByDay(tasks.map((t) => t.updatedAt));
    return {
      title: 'Team Completion Trend (Last 30 Days)',
      chartType: 'line',
      data: {
        labels: trend.map((t) => t.date),
        datasets: [{ label: 'Completed Tasks', data: trend.map((t) => t.count) }],
      },
    };
  }

  // ── 6. Member Growth ────────────────────────────────────────────────────────
  // Line chart: cumulative members added per day over the last 30 days.

  private async computeMemberGrowth(teamId: string) {
    const members = await this.prisma.teamMember.findMany({
      where: {
        teamId,
        createdAt: { gte: daysAgo(30) },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    const trend = groupByDay(members.map((m) => m.createdAt));
    return {
      title: 'Team Member Growth (Last 30 Days)',
      chartType: 'line',
      data: {
        labels: trend.map((t) => t.date),
        datasets: [{ label: 'Members Added', data: trend.map((t) => t.count) }],
      },
    };
  }
}
