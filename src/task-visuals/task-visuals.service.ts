import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetVisualDto } from './dto/get-visual.dto';

type VisualType =
  | 'task_status'
  | 'priority'
  | 'workload'
  | 'completion_trend'
  | 'overdue'
  | 'productivity';

const TEAM_VISUAL_TYPES: VisualType[] = [
  'task_status',
  'priority',
  'workload',
  'completion_trend',
  'overdue',
  'productivity',
];

const INDIVIDUAL_VISUAL_TYPES: VisualType[] = [
  'task_status',
  'priority',
  'completion_trend',
  'overdue',
];

@Injectable()
export class TaskVisualsService {
  constructor(private prisma: PrismaService) {}

  // ─── Snapshot Key Builders ────────────────────────────────────────────────

  private teamKey(type: VisualType, teamId: string) {
    return `team_${type}_${teamId}`;
  }

  private individualKey(type: VisualType, userId: string) {
    return `individual_${type}_${userId}`;
  }

  // ─── Refresh: called by ProjectTasksService on every task mutation ────────

  /**
   * Recomputes and upserts all team visual snapshots for the given teamId.
   * Called automatically after task create / update / delete.
   * Runs fire-and-forget (caller does not await).
   */
  async refreshTeamSnapshots(teamId: string): Promise<void> {
    const snapshots = await Promise.all(
      TEAM_VISUAL_TYPES.map((type) => this.computeTeamVisual(type, teamId)),
    );

    await Promise.all(
      snapshots.map((snap) =>
        this.prisma.taskVisual.upsert({
          where: { key: snap.key },
          update: { title: snap.title, chartType: snap.chartType, data: snap.data as any, isActive: true },
          create: snap as any,
        }),
      ),
    );
  }

  /**
   * Recomputes and upserts all individual visual snapshots for the given userId.
   * Called automatically after task create / update / delete.
   * Runs fire-and-forget (caller does not await).
   */
  async refreshIndividualSnapshots(userId: string): Promise<void> {
    const snapshots = await Promise.all(
      INDIVIDUAL_VISUAL_TYPES.map((type) => this.computeIndividualVisual(type, userId)),
    );

    await Promise.all(
      snapshots.map((snap) =>
        this.prisma.taskVisual.upsert({
          where: { key: snap.key },
          update: { title: snap.title, chartType: snap.chartType, data: snap.data as any, isActive: true },
          create: snap as any,
        }),
      ),
    );
  }

  // ─── GET: Team Endpoints ──────────────────────────────────────────────────

  async getTeamVisual(type: VisualType, teamId: string, dto: GetVisualDto) {
    // Filters other than defaults → compute live so filters are applied
    if (dto.dateRange || dto.from || dto.to || dto.priority?.length || dto.status?.length) {
      return this.computeTeamVisualFiltered(type, teamId, dto);
    }

    // No filters → serve from snapshot (fast path)
    const snapshot = await this.prisma.taskVisual.findUnique({
      where: { key: this.teamKey(type, teamId) },
    });

    // Snapshot exists → return it
    if (snapshot) return snapshot;

    // First-time: compute live, store, and return
    const computed = await this.computeTeamVisual(type, teamId);
    await this.prisma.taskVisual.upsert({
      where: { key: computed.key },
      update: { data: computed.data as any },
      create: computed as any,
    });
    return computed;
  }

  // ─── GET: Individual Endpoints ────────────────────────────────────────────

  async getIndividualVisual(type: VisualType, userId: string, dto: GetVisualDto) {
    // Filters → always compute live
    if (dto.dateRange || dto.from || dto.to || dto.priority?.length || dto.status?.length) {
      return this.computeIndividualVisualFiltered(type, userId, dto);
    }

    const snapshot = await this.prisma.taskVisual.findUnique({
      where: { key: this.individualKey(type, userId) },
    });

    if (snapshot) return snapshot;

    const computed = await this.computeIndividualVisual(type, userId);
    await this.prisma.taskVisual.upsert({
      where: { key: computed.key },
      update: { data: computed.data as any },
      create: computed as any,
    });
    return computed;
  }

  // ─── Compute: Team (no filters, for snapshot storage) ────────────────────

  private async computeTeamVisual(type: VisualType, teamId: string) {
    const data = await this.aggregateTeam(type, teamId, {});
    return {
      key: this.teamKey(type, teamId),
      title: data.title,
      type,
      mode: 'team',
      teamId,
      chartType: data.chartType,
      data: data.data,
      isActive: true,
    };
  }

  // ─── Compute: Individual (no filters, for snapshot storage) ──────────────

  private async computeIndividualVisual(type: VisualType, userId: string) {
    const data = await this.aggregateIndividual(type, userId, {});
    return {
      key: this.individualKey(type, userId),
      title: data.title,
      type,
      mode: 'individual',
      userId,
      chartType: data.chartType,
      data: data.data,
      isActive: true,
    };
  }

  // ─── Compute: Team with filters (live, not stored) ───────────────────────

  private computeTeamVisualFiltered(type: VisualType, teamId: string, dto: GetVisualDto) {
    return this.aggregateTeam(type, teamId, dto);
  }

  private computeIndividualVisualFiltered(type: VisualType, userId: string, dto: GetVisualDto) {
    return this.aggregateIndividual(type, userId, dto);
  }

  // ─── Core Aggregation: Team ───────────────────────────────────────────────

  private async aggregateTeam(type: VisualType, teamId: string, dto: GetVisualDto) {
    const base = this.buildBaseFilter(dto, { teamId });

    switch (type) {
      case 'task_status':
        return this.teamTaskStatus(teamId, base);
      case 'priority':
        return this.teamPriority(teamId, base);
      case 'workload':
        return this.teamWorkload(teamId, base);
      case 'completion_trend':
        return this.teamCompletionTrend(teamId, dto);
      case 'overdue':
        return this.teamOverdue(teamId, base);
      case 'productivity':
        return this.teamProductivity(teamId, base);
    }
  }

  // ─── Core Aggregation: Individual ────────────────────────────────────────

  private async aggregateIndividual(type: VisualType, userId: string, dto: GetVisualDto) {
    const base = this.buildBaseFilter(dto, {
      OR: [{ creatorId: userId }, { assignedUserId: userId }, { inchargeId: userId }],
    });

    switch (type) {
      case 'task_status':
        return this.individualTaskStatus(userId, base);
      case 'priority':
        return this.individualPriority(userId, base);
      case 'completion_trend':
        return this.individualCompletionTrend(userId, dto);
      case 'overdue':
        return this.individualOverdue(userId, base);
      default:
        return this.individualTaskStatus(userId, base);
    }
  }

  // ─── Aggregation Implementations ─────────────────────────────────────────

  private async teamTaskStatus(teamId: string, where: any) {
    const groups = await this.prisma.projectTask.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });
    const all = this.sortStatuses(groups);
    return {
      title: 'Team Task Status Overview',
      chartType: 'bar',
      data: {
        labels: all.map((g) => g.status),
        datasets: [{ label: 'Team Tasks', data: all.map((g) => g._count.id) }],
      },
    };
  }

  private async teamPriority(teamId: string, where: any) {
    const groups = await this.prisma.projectTask.groupBy({
      by: ['priority'],
      where,
      _count: { id: true },
    });
    return {
      title: 'Team Task Priority Breakdown',
      chartType: 'pie',
      data: {
        labels: groups.map((g) => g.priority),
        datasets: [{ label: 'Tasks by Priority', data: groups.map((g) => g._count.id) }],
      },
    };
  }

  private async teamWorkload(teamId: string, where: any) {
    const groups = await this.prisma.projectTask.groupBy({
      by: ['inchargeId', 'inchargeName'],
      where: { ...where, NOT: { inchargeId: null } },
      _count: { id: true },
    });
    return {
      title: 'Team Workload Distribution',
      chartType: 'stacked_bar',
      data: {
        labels: groups.map((g) => g.inchargeName ?? 'Unknown'),
        datasets: [{ label: 'Assigned Tasks', data: groups.map((g) => g._count.id) }],
      },
    };
  }

  private async teamCompletionTrend(teamId: string, dto: GetVisualDto) {
    const dateFilter = this.getDateFilter(dto) ?? this.getDateFilter({ dateRange: 'weekly' });
    const tasks = await this.prisma.projectTask.findMany({
      where: {
        teamId,
        status: 'COMPLETED',
        ...(dateFilter && { updatedAt: dateFilter }),
        ...(dto.priority?.length && { priority: { in: dto.priority } }),
      },
      select: { updatedAt: true },
      orderBy: { updatedAt: 'asc' },
    });
    const grouped = this.groupByDay(tasks.map((t) => t.updatedAt));
    return {
      title: 'Team Completion Trend',
      chartType: 'line',
      data: {
        labels: Object.keys(grouped),
        datasets: [{ label: 'Completed Tasks', data: Object.values(grouped) }],
      },
    };
  }

  private async teamOverdue(teamId: string, where: any) {
    const tasks = await this.prisma.projectTask.findMany({
      where: { ...where, dueDate: { lt: new Date() }, NOT: { status: 'COMPLETED' } },
      select: { priority: true },
    });
    const byPriority = this.countByField(tasks, 'priority');
    return {
      title: 'Team Overdue Tasks',
      chartType: 'bar',
      data: {
        labels: Object.keys(byPriority),
        datasets: [{ label: 'Overdue Tasks', data: Object.values(byPriority) }],
      },
      total: tasks.length,
    };
  }

  private async teamProductivity(teamId: string, where: any) {
    const groups = await this.prisma.projectTask.groupBy({
      by: ['inchargeId', 'inchargeName'],
      where: { ...where, status: 'COMPLETED', NOT: { inchargeId: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
    return {
      title: 'Team Productivity',
      chartType: 'bar',
      data: {
        labels: groups.map((g) => g.inchargeName ?? 'Unknown'),
        datasets: [{ label: 'Completed Tasks', data: groups.map((g) => g._count.id) }],
      },
    };
  }

  private async individualTaskStatus(userId: string, where: any) {
    const groups = await this.prisma.projectTask.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });
    const all = this.sortStatuses(groups);
    return {
      title: 'My Task Status Overview',
      chartType: 'doughnut',
      data: {
        labels: all.map((g) => g.status),
        datasets: [{ data: all.map((g) => g._count.id) }],
      },
    };
  }

  private async individualPriority(userId: string, where: any) {
    const groups = await this.prisma.projectTask.groupBy({
      by: ['priority'],
      where,
      _count: { id: true },
    });
    return {
      title: 'My Task Priority Breakdown',
      chartType: 'pie',
      data: {
        labels: groups.map((g) => g.priority),
        datasets: [{ data: groups.map((g) => g._count.id) }],
      },
    };
  }

  private async individualCompletionTrend(userId: string, dto: GetVisualDto) {
    const dateFilter = this.getDateFilter(dto) ?? this.getDateFilter({ dateRange: 'weekly' });
    const tasks = await this.prisma.projectTask.findMany({
      where: {
        OR: [{ creatorId: userId }, { assignedUserId: userId }, { inchargeId: userId }],
        status: 'COMPLETED',
        ...(dateFilter && { updatedAt: dateFilter }),
      },
      select: { updatedAt: true },
      orderBy: { updatedAt: 'asc' },
    });
    const grouped = this.groupByDay(tasks.map((t) => t.updatedAt));
    return {
      title: 'My Completion Trend',
      chartType: 'line',
      data: {
        labels: Object.keys(grouped),
        datasets: [{ label: 'Completed Tasks', data: Object.values(grouped) }],
      },
    };
  }

  private async individualOverdue(userId: string, where: any) {
    const tasks = await this.prisma.projectTask.findMany({
      where: { ...where, dueDate: { lt: new Date() }, NOT: { status: 'COMPLETED' } },
      select: { priority: true },
    });
    const byPriority = this.countByField(tasks, 'priority');
    return {
      title: 'My Overdue Tasks',
      chartType: 'bar',
      data: {
        labels: Object.keys(byPriority),
        datasets: [{ label: 'Overdue Tasks', data: Object.values(byPriority) }],
      },
      total: tasks.length,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private getDateFilter(dto: Partial<GetVisualDto>): { gte?: Date; lte?: Date } | undefined {
    const now = new Date();
    if (dto.dateRange === 'weekly') {
      const gte = new Date(now);
      gte.setDate(now.getDate() - 7);
      return { gte };
    }
    if (dto.dateRange === 'monthly') {
      const gte = new Date(now);
      gte.setMonth(now.getMonth() - 1);
      return { gte };
    }
    if (dto.dateRange === 'yearly') {
      const gte = new Date(now);
      gte.setFullYear(now.getFullYear() - 1);
      return { gte };
    }
    if (dto.dateRange === 'custom' && (dto.from || dto.to)) {
      return {
        ...(dto.from && { gte: new Date(dto.from) }),
        ...(dto.to && { lte: new Date(dto.to) }),
      };
    }
    return undefined;
  }

  private buildBaseFilter(dto: GetVisualDto, extra: Record<string, any> = {}) {
    const dateFilter = this.getDateFilter(dto);
    return {
      ...extra,
      ...(dateFilter && { createdAt: dateFilter }),
      ...(dto.priority?.length && { priority: { in: dto.priority } }),
      ...(dto.status?.length && { status: { in: dto.status } }),
    };
  }

  private sortStatuses<T extends { status: string }>(groups: T[]): T[] {
    const order = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'];
    const sorted = order.map((s) => groups.find((g) => g.status === s)).filter(Boolean) as T[];
    const rest = groups.filter((g) => !order.includes(g.status));
    return [...sorted, ...rest];
  }

  private groupByDay(dates: Date[]): Record<string, number> {
    const result: Record<string, number> = {};
    for (const date of dates) {
      const key = date.toISOString().slice(0, 10);
      result[key] = (result[key] ?? 0) + 1;
    }
    return result;
  }

  private countByField(items: any[], field: string): Record<string, number> {
    const result: Record<string, number> = {};
    for (const item of items) {
      const key = item[field] ?? 'Unknown';
      result[key] = (result[key] ?? 0) + 1;
    }
    return result;
  }
}
