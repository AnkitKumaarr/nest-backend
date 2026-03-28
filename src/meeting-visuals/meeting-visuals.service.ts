import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type MeetingVisualType =
  | 'meeting_status'
  | 'duration_trend'
  | 'frequency'
  | 'participant_engagement'
  | 'time_of_day'
  | 'recurring_ratio';

const COMPANY_TYPES: MeetingVisualType[] = [
  'meeting_status',
  'duration_trend',
  'frequency',
  'participant_engagement',
  'time_of_day',
  'recurring_ratio',
];

const INDIVIDUAL_TYPES: MeetingVisualType[] = [
  'meeting_status',
  'duration_trend',
  'frequency',
  'time_of_day',
];

@Injectable()
export class MeetingVisualsService {
  constructor(private prisma: PrismaService) {}

  // ─── Keys ─────────────────────────────────────────────────────────────────

  private companyKey(type: MeetingVisualType, companyId: string) {
    return `company_${type}_${companyId}`;
  }

  private individualKey(type: MeetingVisualType, userId: string) {
    return `individual_${type}_${userId}`;
  }

  // ─── Refresh (fire-and-forget from MeetingsService) ───────────────────────

  async refreshCompanySnapshots(companyId: string): Promise<void> {
    const snapshots = await Promise.all(
      COMPANY_TYPES.map((type) => this.computeCompanyVisual(type, companyId)),
    );
    await Promise.all(
      snapshots.map((s) =>
        this.prisma.meetingVisual.upsert({
          where: { key: s.key },
          update: { title: s.title, chartType: s.chartType, data: s.data as any, isActive: true },
          create: s as any,
        }),
      ),
    );
  }

  async refreshIndividualSnapshots(userId: string): Promise<void> {
    const snapshots = await Promise.all(
      INDIVIDUAL_TYPES.map((type) => this.computeIndividualVisual(type, userId)),
    );
    await Promise.all(
      snapshots.map((s) =>
        this.prisma.meetingVisual.upsert({
          where: { key: s.key },
          update: { title: s.title, chartType: s.chartType, data: s.data as any, isActive: true },
          create: s as any,
        }),
      ),
    );
  }

  // ─── GET ──────────────────────────────────────────────────────────────────

  async getCompanyVisual(type: MeetingVisualType, companyId: string) {
    const snapshot = await this.prisma.meetingVisual.findUnique({
      where: { key: this.companyKey(type, companyId) },
    });
    if (snapshot) return snapshot;

    const computed = await this.computeCompanyVisual(type, companyId);
    await this.prisma.meetingVisual.upsert({
      where: { key: computed.key },
      update: { data: computed.data as any },
      create: computed as any,
    });
    return computed;
  }

  async getIndividualVisual(type: MeetingVisualType, userId: string) {
    const snapshot = await this.prisma.meetingVisual.findUnique({
      where: { key: this.individualKey(type, userId) },
    });
    if (snapshot) return snapshot;

    const computed = await this.computeIndividualVisual(type, userId);
    await this.prisma.meetingVisual.upsert({
      where: { key: computed.key },
      update: { data: computed.data as any },
      create: computed as any,
    });
    return computed;
  }

  // ─── Compute: Company ─────────────────────────────────────────────────────

  private async computeCompanyVisual(type: MeetingVisualType, companyId: string) {
    const data = await this.aggregateCompany(type, companyId);
    return {
      key: this.companyKey(type, companyId),
      title: data.title,
      type,
      mode: 'company',
      companyId,
      chartType: data.chartType,
      data: data.data,
      isActive: true,
    };
  }

  // ─── Compute: Individual ──────────────────────────────────────────────────

  private async computeIndividualVisual(type: MeetingVisualType, userId: string) {
    const data = await this.aggregateIndividual(type, userId);
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

  // ─── Aggregation Router ───────────────────────────────────────────────────

  private aggregateCompany(type: MeetingVisualType, companyId: string) {
    const where = { companyId };
    switch (type) {
      case 'meeting_status':       return this.meetingStatus(where, 'Company Meeting Status');
      case 'duration_trend':       return this.durationTrend(where, 'Company Meeting Duration Trend');
      case 'frequency':            return this.frequency(where, 'Company Meeting Frequency');
      case 'participant_engagement': return this.participantEngagement(companyId);
      case 'time_of_day':          return this.timeOfDay(where, 'Company Meetings by Time of Day');
      case 'recurring_ratio':      return this.recurringRatio(where, 'Recurring vs One-Time Meetings');
    }
  }

  private aggregateIndividual(type: MeetingVisualType, userId: string) {
    const where = { OR: [{ createdBy: userId }, { participants: { some: { userId } } }] };
    switch (type) {
      case 'meeting_status': return this.meetingStatus(where, 'My Meeting Status');
      case 'duration_trend': return this.durationTrend(where, 'My Meeting Duration Trend');
      case 'frequency':      return this.frequency(where, 'My Meeting Frequency');
      case 'time_of_day':    return this.timeOfDay(where, 'My Meetings by Time of Day');
      default:               return this.meetingStatus(where, 'My Meeting Status');
    }
  }

  // ─── Visual Implementations ───────────────────────────────────────────────

  private async meetingStatus(where: any, title: string) {
    const groups = await this.prisma.meeting.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });
    return {
      title,
      chartType: 'doughnut',
      data: {
        labels: groups.map((g) => g.status),
        datasets: [{ data: groups.map((g) => g._count.id) }],
      },
    };
  }

  private async durationTrend(where: any, title: string) {
    // Last 30 days — average meeting duration per day
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const meetings = await this.prisma.meeting.findMany({
      where: { ...where, startTime: { gte: since } },
      select: { startTime: true, endTime: true },
      orderBy: { startTime: 'asc' },
    });

    // Group by day, compute average duration (minutes)
    const dayMap: Record<string, { total: number; count: number }> = {};
    for (const m of meetings) {
      const key = m.startTime.toISOString().slice(0, 10);
      const mins = (m.endTime.getTime() - m.startTime.getTime()) / 60000;
      if (!dayMap[key]) dayMap[key] = { total: 0, count: 0 };
      dayMap[key].total += mins;
      dayMap[key].count += 1;
    }

    const labels = Object.keys(dayMap);
    const avgDurations = labels.map((k) => Math.round(dayMap[k].total / dayMap[k].count));

    return {
      title,
      chartType: 'line',
      data: {
        labels,
        datasets: [{ label: 'Avg Duration (mins)', data: avgDurations }],
      },
    };
  }

  private async frequency(where: any, title: string) {
    // Meetings per day — last 30 days
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const meetings = await this.prisma.meeting.findMany({
      where: { ...where, startTime: { gte: since } },
      select: { startTime: true },
      orderBy: { startTime: 'asc' },
    });

    const grouped = this.groupByDay(meetings.map((m) => m.startTime));
    return {
      title,
      chartType: 'bar',
      data: {
        labels: Object.keys(grouped),
        datasets: [{ label: 'Meetings', data: Object.values(grouped) }],
      },
    };
  }

  private async participantEngagement(companyId: string) {
    // Distribution: how many meetings had 1–3, 4–6, 7–10, 10+ participants
    const meetings = await this.prisma.meeting.findMany({
      where: { companyId },
      select: { id: true, _count: { select: { participants: true } } },
    });

    const buckets: Record<string, number> = {
      '1–3': 0,
      '4–6': 0,
      '7–10': 0,
      '10+': 0,
    };

    for (const m of meetings) {
      const n = m._count.participants;
      if (n <= 3) buckets['1–3']++;
      else if (n <= 6) buckets['4–6']++;
      else if (n <= 10) buckets['7–10']++;
      else buckets['10+']++;
    }

    return {
      title: 'Meetings by Participant Count',
      chartType: 'bar',
      data: {
        labels: Object.keys(buckets),
        datasets: [{ label: 'Number of Meetings', data: Object.values(buckets) }],
      },
    };
  }

  private async timeOfDay(where: any, title: string) {
    // Distribution by time slot: Morning (6–12), Afternoon (12–17), Evening (17–22), Night (22–6)
    const meetings = await this.prisma.meeting.findMany({
      where,
      select: { startTime: true },
    });

    const slots: Record<string, number> = {
      'Morning (6–12)': 0,
      'Afternoon (12–17)': 0,
      'Evening (17–22)': 0,
      'Night (22–6)': 0,
    };

    for (const m of meetings) {
      const hour = m.startTime.getHours();
      if (hour >= 6 && hour < 12) slots['Morning (6–12)']++;
      else if (hour >= 12 && hour < 17) slots['Afternoon (12–17)']++;
      else if (hour >= 17 && hour < 22) slots['Evening (17–22)']++;
      else slots['Night (22–6)']++;
    }

    return {
      title,
      chartType: 'bar',
      data: {
        labels: Object.keys(slots),
        datasets: [{ label: 'Meetings', data: Object.values(slots) }],
      },
    };
  }

  private async recurringRatio(where: any, title: string) {
    const [recurring, oneTime] = await Promise.all([
      this.prisma.meeting.count({ where: { ...where, isRecurring: true } }),
      this.prisma.meeting.count({ where: { ...where, isRecurring: false } }),
    ]);

    return {
      title,
      chartType: 'doughnut',
      data: {
        labels: ['Recurring', 'One-Time'],
        datasets: [{ data: [recurring, oneTime] }],
      },
    };
  }

  // ─── Helper ───────────────────────────────────────────────────────────────

  private groupByDay(dates: Date[]): Record<string, number> {
    const result: Record<string, number> = {};
    for (const d of dates) {
      const key = d.toISOString().slice(0, 10);
      result[key] = (result[key] ?? 0) + 1;
    }
    return result;
  }
}
