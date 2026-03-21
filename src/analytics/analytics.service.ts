import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private activityLogs: ActivityLogsService, // Added to provide recent activity feed
  ) {}

  // Helper to determine the database filter for meetings (uses createdBy)
  private getMeetingFilter(userId: string, role: string, from?: string, to?: string) {
    const baseFilter: any = role === 'admin' ? {} : { createdBy: userId };
    if (from || to) {
      baseFilter.createdAt = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      };
    }
    return baseFilter;
  }

  // Helper to determine the database filter for weekTasks (uses userId)
  private getWeekTaskFilter(userId: string, role: string, from?: string, to?: string) {
    const baseFilter: any = role === 'admin' ? {} : { userId };
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
    const weekTaskFilter = this.getWeekTaskFilter(userId, role, from, to);
    const meetingFilter = this.getMeetingFilter(userId, role, from, to);

    const userDateFilter =
      role === 'admin'
        ? {
            ...(from && { createdAt: { gte: new Date(from) } }),
            ...(to && { createdAt: { lte: new Date(to) } }),
          }
        : {};

    const [taskCount, meetingCount, userCount, recentLogs] = await Promise.all([
      this.prisma.weekTask.count({ where: weekTaskFilter }),
      this.prisma.meeting.count({ where: meetingFilter }),
      role === 'admin'
        ? this.prisma.user.count({ where: userDateFilter })
        : Promise.resolve(0),
      this.activityLogs.findAll(userId, role),
    ]);

    const taskStats = await this.prisma.weekTask.groupBy({
      by: ['status'],
      where: weekTaskFilter,
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
    const filter = this.getWeekTaskFilter(userId, role, from, to);

    const priorityStats = await this.prisma.weekTask.groupBy({
      by: ['priority'],
      where: filter,
      _count: { id: true },
    });

    return {
      priorityBreakdown: priorityStats.map((p) => ({
        priority: p.priority,
        count: p._count.id,
      })),
    };
  }

  async getMeetingAnalytics(userId: string, role: string, from?: string, to?: string) {
    const filter = this.getMeetingFilter(userId, role, from, to);

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