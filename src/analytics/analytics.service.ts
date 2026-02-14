import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private activityLogs: ActivityLogsService, // Added to provide recent activity feed
  ) {}

  // Helper to determine the database filter
  private getFilter(userId: string, role: string, from?: string, to?: string) {
    const baseFilter: any = role === 'admin' ? {} : { createdBy: userId };

    // If dates are provided, add the date range filter
    if (from || to) {
      baseFilter.createdAt = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      };
    }
    return baseFilter;
  }

  async getDashboardSummary(
    userId: string,
    role: string,
    from?: string,
    to?: string,
  ) {
    const filter = this.getFilter(userId, role, from, to);

    const userDateFilter =
      role === 'admin'
        ? {
            ...(from && { createdAt: { gte: new Date(from) } }),
            ...(to && { createdAt: { lte: new Date(to) } }),
          }
        : {};

    const [taskCount, meetingCount, userCount, recentLogs] = await Promise.all([
      this.prisma.task.count({ where: filter }),
      this.prisma.meeting.count({ where: filter }),
      role === 'admin'
        ? this.prisma.user.count({ where: userDateFilter })
        : Promise.resolve(0),
      this.activityLogs.findAll(userId, role), // Fetch logs for the "Recent Activity" feed
    ]);

    const taskStats = await this.prisma.task.groupBy({
      by: ['status'],
      where: filter,
      _count: { id: true },
    });

    return {
      scope: role === 'admin' ? 'Organization-wide' : 'Personal',
      timeframe: { from, to },
      stats: {
        totalTasks: taskCount,
        totalMeetings: meetingCount,
        newUsersInPeriod: role === 'admin' ? userCount : undefined,
      },
      taskStatusDistribution: taskStats.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      recentActivity: recentLogs.slice(0, 5), // Include the 5 most recent actions
    };
  }

  async getTaskAnalytics(userId: string, role: string, from?: string, to?: string) {
    const filter = this.getFilter(userId, role, from, to); // Added from/to support

    const priorityStats = await this.prisma.task.groupBy({
      by: ['priority'],
      where: filter,
      _count: { id: true },
    });

    const overdueCount = await this.prisma.task.count({
      where: {
        ...filter,
        status: { not: 'completed' },
        dueDate: { lt: new Date() },
      },
    });

    return {
      priorityBreakdown: priorityStats.map((p) => ({
        priority: p.priority,
        count: p._count.id,
      })),
      overdueTasks: overdueCount,
    };
  }

  async getMeetingAnalytics(userId: string, role: string, from?: string, to?: string) {
    const filter = this.getFilter(userId, role, from, to); // Added from/to support

    const meetings = await this.prisma.meeting.findMany({
      where: filter,
      select: { startTime: true, endTime: true },
    });

    const totalMinutes = meetings.reduce((acc, m) => {
      return acc + (m.endTime.getTime() - m.startTime.getTime()) / (1000 * 60);
    }, 0);

    return {
      totalMeetingsInPeriod: meetings.length,
      totalHoursSpent: (totalMinutes / 60).toFixed(1),
      averageMeetingDuration:
        meetings.length > 0 ? (totalMinutes / meetings.length).toFixed(0) : 0,
    };
  }
}