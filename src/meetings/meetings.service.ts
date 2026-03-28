import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { EventsGateway } from '../gateways/events.gateway';
import { MeetingVisualsService } from '../meeting-visuals/meeting-visuals.service';
import { AnalyticsSnapshotService } from '../analytics-snapshot/analytics-snapshot.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { ListMeetingsDto } from './dto/list-meetings.dto';
import { CancelMeetingDto } from './dto/cancel-meeting.dto';
import { DateRangeDto, ParticipationTrendDto } from './dto/date-range.dto';

// ─── Badge definitions ───────────────────────────────────────────────────────
// Badges are computed dynamically from meeting stats — no separate DB table needed.

interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  check: (stats: BadgeStats) => Date | null;
}

interface BadgeStats {
  totalMeetings: number;
  currentStreak: number;
  longestStreak: number;
  onTimeRate: number;      // 0–100
  firstMeetingDate: Date | null;
}

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first_meeting',
    title: 'First Step',
    description: 'Attended your first meeting',
    icon: '🎯',
    check: (s) => (s.totalMeetings >= 1 && s.firstMeetingDate ? s.firstMeetingDate : null),
  },
  {
    id: 'ten_meetings',
    title: 'Meeting Regular',
    description: 'Attended 10 meetings',
    icon: '📅',
    check: (s) => (s.totalMeetings >= 10 && s.firstMeetingDate ? s.firstMeetingDate : null),
  },
  {
    id: 'fifty_meetings',
    title: 'Meeting Pro',
    description: 'Attended 50 meetings',
    icon: '🏆',
    check: (s) => (s.totalMeetings >= 50 && s.firstMeetingDate ? s.firstMeetingDate : null),
  },
  {
    id: 'streak_5',
    title: 'On a Roll',
    description: 'Maintained a 5-meeting attendance streak',
    icon: '🔥',
    check: (s) => (s.longestStreak >= 5 && s.firstMeetingDate ? s.firstMeetingDate : null),
  },
  {
    id: 'streak_10',
    title: 'Unstoppable',
    description: 'Maintained a 10-meeting attendance streak',
    icon: '⚡',
    check: (s) => (s.longestStreak >= 10 && s.firstMeetingDate ? s.firstMeetingDate : null),
  },
  {
    id: 'punctual',
    title: 'Always On Time',
    description: 'Achieved 90%+ on-time attendance rate',
    icon: '⏰',
    check: (s) => (s.onTimeRate >= 90 && s.firstMeetingDate ? s.firstMeetingDate : null),
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDateRangeBounds(dto: DateRangeDto): { start: Date; end: Date } {
  const end = dto.endDate ? new Date(dto.endDate) : new Date();
  const start = dto.startDate
    ? new Date(dto.startDate)
    : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { start, end };
}

function formatParticipant(p: {
  id: string;
  userId: string;
  status: string;
  user: { id: string; fullName: string | null; firstName: string | null; lastName: string | null; email: string; avatarUrl: string | null };
}) {
  return {
    id: p.userId,
    name: p.user.fullName ?? `${p.user.firstName ?? ''} ${p.user.lastName ?? ''}`.trim(),
    email: p.user.email,
    avatar: p.user.avatarUrl,
    status: capitalizeFirst(p.status),
  };
}

function formatMeeting(meeting: any) {
  return {
    id: meeting.id,
    title: meeting.title,
    description: meeting.description ?? '',
    startTime: meeting.startTime.toISOString(),
    endTime: meeting.endTime.toISOString(),
    status: meeting.status,
    isRecurring: meeting.isRecurring,
    recurringDays: meeting.recurringDays ?? [],
    meetingLink: meeting.meetingLink ?? '',
    meetingType: meeting.meetingType ?? null,
    createdBy: meeting.createdBy,
    createdAt: meeting.createdAt.toISOString(),
    updatedAt: meeting.updatedAt.toISOString(),
    participants: (meeting.participants ?? []).map(formatParticipant),
  };
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function userMeetingFilter(userId: string) {
  return {
    OR: [
      { createdBy: userId },
      { participants: { some: { userId } } },
    ],
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class MeetingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
    private readonly eventsGateway: EventsGateway,
    private readonly meetingVisuals: MeetingVisualsService,
    private readonly analyticsSnapshot: AnalyticsSnapshotService,
  ) {}

  // ── 1. Analytics (overview summary cards) ───────────────────────────────────

  async getAnalytics(userId: string) {
    const meetings = await this.prisma.meeting.findMany({
      where: userMeetingFilter(userId),
      include: { participants: true },
    });

    const now = new Date();
    const totalMeetings = meetings.length;
    const upcomingMeetings = meetings.filter((m) => m.status === 'Upcoming').length;
    const completedMeetings = meetings.filter((m) => m.status === 'Completed').length;

    const durationsMinutes = meetings.map(
      (m) => (m.endTime.getTime() - m.startTime.getTime()) / 60_000,
    );
    const averageDuration =
      durationsMinutes.length > 0
        ? Math.round(durationsMinutes.reduce((a, b) => a + b, 0) / durationsMinutes.length)
        : 0;

    const { currentStreak } = this.computeStreakStats(meetings, userId);
    const onTimeAttendance = this.computeOnTimeRate(meetings, userId);

    return {
      totalMeetings,
      upcomingMeetings,
      completedMeetings,
      averageDuration,
      attendanceStreak: currentStreak,
      onTimeAttendance,
    };
  }

  // ── 2. Next upcoming meeting ─────────────────────────────────────────────────

  async getNextMeeting(userId: string) {
    const now = new Date();
    const meeting = await this.prisma.meeting.findFirst({
      where: {
        ...userMeetingFilter(userId),
        status: 'Upcoming',
        startTime: { gt: now },
      },
      orderBy: { startTime: 'asc' },
      include: { participants: { include: { user: { select: { id: true, fullName: true, firstName: true, lastName: true, email: true, avatarUrl: true } } } } },
    });

    if (!meeting) return null;
    return formatMeeting(meeting);
  }

  // ── 3. Attendance streak ─────────────────────────────────────────────────────

  async getStreak(userId: string) {
    const meetings = await this.prisma.meeting.findMany({
      where: userMeetingFilter(userId),
      orderBy: { startTime: 'asc' },
    });

    const { currentStreak, longestStreak } = this.computeStreakStats(meetings, userId);
    return { current: currentStreak, longest: longestStreak, type: 'attendance' };
  }

  // ── 4. User badges ───────────────────────────────────────────────────────────

  async getBadges(userId: string) {
    const meetings = await this.prisma.meeting.findMany({
      where: userMeetingFilter(userId),
      orderBy: { startTime: 'asc' },
    });

    const totalMeetings = meetings.filter((m) => m.status === 'Completed').length;
    const { currentStreak, longestStreak } = this.computeStreakStats(meetings, userId);
    const onTimeRate = this.computeOnTimeRate(meetings, userId);
    const firstMeeting = meetings.find((m) => m.status === 'Completed');

    const stats: BadgeStats = {
      totalMeetings,
      currentStreak,
      longestStreak,
      onTimeRate,
      firstMeetingDate: firstMeeting?.startTime ?? null,
    };

    return BADGE_DEFINITIONS.filter((badge) => badge.check(stats) !== null).map((badge) => {
      const earnedAt = badge.check(stats) as Date;
      return {
        id: badge.id,
        title: badge.title,
        description: badge.description,
        icon: badge.icon,
        earned: true,
        earnedAt: earnedAt.toISOString(),
      };
    });
  }

  // ── 5. List meetings (paginated, filterable) ─────────────────────────────────

  async listMeetings(dto: ListMeetingsDto, userId: string) {
    const { status, search, startDate, endDate, page = 1, limit = 20 } = dto;
    const skip = (page - 1) * limit;

    const where: any = { ...userMeetingFilter(userId) };

    if (status && status !== 'All') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }

    const [meetings, total] = await Promise.all([
      this.prisma.meeting.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startTime: 'asc' },
        include: { participants: { include: { user: { select: { id: true, fullName: true, firstName: true, lastName: true, email: true, avatarUrl: true } } } } },
      }),
      this.prisma.meeting.count({ where }),
    ]);

    return {
      data: meetings.map(formatMeeting),
      total,
      page,
      limit,
    };
  }

  // ── 6. Create meeting ────────────────────────────────────────────────────────

  async create(dto: CreateMeetingDto, userId: string, companyId: string) {
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);

    if (start >= end) {
      throw new BadRequestException('End time must be after start time');
    }

    const conflict = await this.prisma.meeting.findFirst({
      where: {
        createdBy: userId,
        status: { notIn: ['Canceled'] },
        OR: [
          { startTime: { lte: start }, endTime: { gt: start } },
          { startTime: { lt: end }, endTime: { gte: end } },
          { startTime: { gte: start }, endTime: { lte: end } },
        ],
      },
    });

    if (conflict) {
      throw new BadRequestException(
        `Schedule conflict: you already have "${conflict.title}" at this time.`,
      );
    }

    const meeting = await this.prisma.meeting.create({
      data: {
        title: dto.title,
        description: dto.description ?? '',
        meetingLink: dto.meetingLink,
        startTime: start,
        endTime: end,
        isRecurring: dto.isRecurring,
        recurringDays: dto.recurringDays ?? [],
        meetingType: dto.meetingType,
        status: 'Upcoming',
        createdBy: userId,
        companyId,
        participants: {
          create: dto.participantIds.map((pid) => ({ userId: pid, status: 'pending' })),
        },
      },
      include: { participants: { include: { user: { select: { id: true, fullName: true, firstName: true, lastName: true, email: true, avatarUrl: true } } } } },
    });

    await this.activityLogs.log(this.prisma, userId, 'MEETING_CREATED', 'Meeting', meeting.id, `Created meeting: ${meeting.title}`);
    this.eventsGateway.sendToOrg(companyId, 'MEETING_CREATED', meeting);
    this.refreshSnapshots(userId, companyId);

    return formatMeeting(meeting);
  }

  // ── 7. Update meeting ────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateMeetingDto, userId: string) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id } });
    if (!meeting) throw new NotFoundException('Meeting not found');
    if (meeting.createdBy !== userId) {
      throw new ForbiddenException('Only the meeting creator can edit it');
    }

    const { participantIds, startTime, endTime, ...rest } = dto;

    const updateData: any = {
      ...rest,
      ...(startTime && { startTime: new Date(startTime) }),
      ...(endTime && { endTime: new Date(endTime) }),
    };

    if (participantIds !== undefined) {
      // Replace participants: delete existing, create new set
      await this.prisma.meetingParticipant.deleteMany({ where: { meetingId: id } });
      updateData.participants = {
        create: participantIds.map((pid) => ({ userId: pid, status: 'pending' })),
      };
    }

    const updated = await this.prisma.meeting.update({
      where: { id },
      data: updateData,
      include: { participants: { include: { user: { select: { id: true, fullName: true, firstName: true, lastName: true, email: true, avatarUrl: true } } } } },
    });

    await this.activityLogs.log(this.prisma, userId, 'MEETING_UPDATED', 'Meeting', id, `Updated meeting: ${updated.title}`);
    if (updated.companyId) this.eventsGateway.sendToOrg(updated.companyId, 'MEETING_UPDATED', updated);
    this.refreshSnapshots(userId, updated.companyId);

    return formatMeeting(updated);
  }

  // ── 8. Cancel meeting ────────────────────────────────────────────────────────

  async cancel(id: string, dto: CancelMeetingDto, userId: string) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id } });
    if (!meeting) throw new NotFoundException('Meeting not found');
    if (meeting.createdBy !== userId) {
      throw new ForbiddenException('Only the meeting creator can cancel it');
    }
    if (meeting.status === 'Canceled') {
      throw new BadRequestException('Meeting is already canceled');
    }

    const updated = await this.prisma.meeting.update({
      where: { id },
      data: {
        status: 'Canceled',
        ...(dto.reason && { cancellationReason: dto.reason }),
      },
    });

    await this.activityLogs.log(this.prisma, userId, 'MEETING_CANCELLED', 'Meeting', id, `Cancelled meeting: ${updated.title}`);
    if (updated.companyId) this.eventsGateway.sendToOrg(updated.companyId, 'MEETING_CANCELLED', { id, status: 'Canceled' });
    this.refreshSnapshots(userId, updated.companyId);

    return {
      id: updated.id,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  // ── 9. Delete meeting ────────────────────────────────────────────────────────

  async remove(id: string, userId: string) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id } });
    if (!meeting) throw new NotFoundException('Meeting not found');
    if (meeting.createdBy !== userId) {
      throw new ForbiddenException('Only the meeting creator can delete it');
    }

    await this.prisma.meetingParticipant.deleteMany({ where: { meetingId: id } });
    await this.prisma.meeting.delete({ where: { id } });

    await this.activityLogs.log(this.prisma, userId, 'MEETING_DELETED', 'Meeting', id, `Deleted meeting: ${meeting.title}`);
    if (meeting.companyId) this.eventsGateway.sendToOrg(meeting.companyId, 'MEETING_DELETED', { id });
    this.refreshSnapshots(userId, meeting.companyId);

    return { message: 'Meeting deleted successfully' };
  }

  // ── 11. Analytics: meetings per day (bar chart) ──────────────────────────────

  async getPerDay(dto: DateRangeDto, userId: string) {
    const { start, end } = getDateRangeBounds(dto);

    const meetings = await this.prisma.meeting.findMany({
      where: {
        ...userMeetingFilter(userId),
        startTime: { gte: start, lte: end },
      },
      select: { startTime: true },
    });

    const countsByDay = new Map<string, number>();
    for (const { startTime } of meetings) {
      const day = startTime.toISOString().slice(0, 10);
      countsByDay.set(day, (countsByDay.get(day) ?? 0) + 1);
    }

    return Array.from(countsByDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }

  // ── 12. Analytics: duration distribution (pie chart) ────────────────────────

  async getDurationDistribution(dto: DateRangeDto, userId: string) {
    const { start, end } = getDateRangeBounds(dto);

    const meetings = await this.prisma.meeting.findMany({
      where: {
        ...userMeetingFilter(userId),
        startTime: { gte: start, lte: end },
      },
      select: { startTime: true, endTime: true },
    });

    const buckets = { short: 0, medium: 0, long: 0 };
    for (const { startTime, endTime } of meetings) {
      const minutes = (endTime.getTime() - startTime.getTime()) / 60_000;
      if (minutes <= 30) buckets.short++;
      else if (minutes <= 60) buckets.medium++;
      else buckets.long++;
    }

    return [
      { label: 'Short (≤30 min)', value: buckets.short, color: '#4CAF50' },
      { label: 'Medium (30–60 min)', value: buckets.medium, color: '#2196F3' },
      { label: 'Long (>60 min)', value: buckets.long, color: '#FF5722' },
    ];
  }

  // ── 13. Analytics: participation trend (line chart) ──────────────────────────

  async getParticipationTrend(dto: ParticipationTrendDto, userId: string) {
    const { start, end } = getDateRangeBounds(dto);
    const groupBy = dto.groupBy ?? 'week';

    const meetings = await this.prisma.meeting.findMany({
      where: {
        ...userMeetingFilter(userId),
        startTime: { gte: start, lte: end },
      },
      select: { startTime: true, participants: { select: { id: true } } },
    });

    const buckets = new Map<string, { total: number; count: number }>();

    for (const { startTime, participants } of meetings) {
      const key =
        groupBy === 'day'
          ? startTime.toISOString().slice(0, 10)
          : this.getWeekKey(startTime);

      const existing = buckets.get(key) ?? { total: 0, count: 0 };
      existing.total += participants.length;
      existing.count += 1;
      buckets.set(key, existing);
    }

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { total, count }]) => ({
        date,
        averageParticipants: count > 0 ? Math.round((total / count) * 10) / 10 : 0,
      }));
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private computeStreakStats(
    meetings: { status: string; startTime: Date }[],
    _userId: string,
  ): { currentStreak: number; longestStreak: number } {
    const attended = meetings
      .filter((m) => m.status === 'Completed')
      .map((m) => m.startTime.toISOString().slice(0, 10))
      .sort();

    const uniqueDays = [...new Set(attended)];

    if (uniqueDays.length === 0) return { currentStreak: 0, longestStreak: 0 };

    let longestStreak = 1;
    let currentRun = 1;

    for (let i = 1; i < uniqueDays.length; i++) {
      const prev = new Date(uniqueDays[i - 1]);
      const curr = new Date(uniqueDays[i]);
      const diffDays = (curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000);

      if (diffDays === 1) {
        currentRun++;
        longestStreak = Math.max(longestStreak, currentRun);
      } else {
        currentRun = 1;
      }
    }

    // Current streak: check if the last meeting day is within the last 2 days
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const lastDay = uniqueDays[uniqueDays.length - 1];
    const isActive = lastDay === today || lastDay === yesterday;
    const currentStreak = isActive ? currentRun : 0;

    return { currentStreak, longestStreak };
  }

  private computeOnTimeRate(
    meetings: { status: string; startTime: Date }[],
    _userId: string,
  ): number {
    // On-time is approximated as attending a Completed meeting on schedule.
    // A full RSVP/check-in system would provide more granular data.
    const completed = meetings.filter((m) => m.status === 'Completed').length;
    if (completed === 0) return 0;
    // For now we return 100 for all completed — this can be replaced once
    // a check-in timestamp is added to MeetingParticipant.
    return 100;
  }

  private getWeekKey(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as week start
    d.setDate(diff);
    return d.toISOString().slice(0, 10);
  }

  private refreshSnapshots(userId: string, companyId: string | null): void {
    if (companyId) {
      this.meetingVisuals.refreshCompanySnapshots(companyId).catch(() => null);
      this.analyticsSnapshot.refreshCompanySnapshot(companyId).catch(() => null);
    }
    this.meetingVisuals.refreshIndividualSnapshots(userId).catch(() => null);
    this.analyticsSnapshot.refreshUserSnapshot(userId).catch(() => null);
  }
}
