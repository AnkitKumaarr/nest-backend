import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service';
import { EventsGateway } from 'src/gateways/events.gateway';

@Injectable()
export class MeetingsService {
  constructor(
    private eventsGateway: EventsGateway,
    private prisma: PrismaService,
    private activityLogs: ActivityLogsService,
  ) {}

  async create(dto: CreateMeetingDto, userId: string, orgId: string) {
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);

    if (start >= end) {
      throw new BadRequestException('End time must be after start time');
    }

    const conflict = await this.prisma.meeting.findFirst({
      where: {
        createdById: userId,
        OR: [
          { startTime: { lte: start }, endTime: { gt: start } },
          { startTime: { lt: end }, endTime: { gte: end } },
          { startTime: { gte: start }, endTime: { lte: end } },
        ],
      },
    });

    if (conflict) {
      throw new BadRequestException(
        `Schedule conflict: You already have a meeting "${conflict.title}" at this time.`,
      );
    }

    const meeting = await this.prisma.meeting.create({
      data: {
        ...dto,
        startTime: start,
        endTime: end,
        organizationId: orgId,
        createdById: userId,
      },
    });

    // 1. LOG: Meeting Creation
    await this.activityLogs.log(
      userId,
      'MEETING_CREATED',
      'Meeting',
      meeting.id,
      `Created meeting: ${meeting.title}`,
    );

    this.eventsGateway.sendToOrg(orgId, 'MEETING_CREATED', meeting);

    return meeting;
  }

  async findAll(userId: string) {
    return this.prisma.meeting.findMany({
      where: {
        OR: [{ createdById: userId }, { participants: { some: { userId } } }],
      },
      include: {
        createdBy: { select: { fullName: true, email: true } },
        participants: true,
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findOne(id: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
      include: { participants: { include: { user: true } }, createdBy: true },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');
    return meeting;
  }

  async update(id: string, dto: any, userId: string) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id } });
    if (!meeting || meeting.createdById !== userId) {
      throw new UnauthorizedException(
        'Only the creator can update the meeting',
      );
    }

    const updatedMeeting = await this.prisma.meeting.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.startTime && { startTime: new Date(dto.startTime) }),
        ...(dto.endTime && { endTime: new Date(dto.endTime) }),
      },
    });

    // 2. LOG: General Update or Cancellation
    const action =
      dto.status === 'cancelled' ? 'MEETING_CANCELLED' : 'MEETING_UPDATED';
    await this.activityLogs.log(
      userId,
      action,
      'Meeting',
      id,
      `Updated meeting: ${updatedMeeting.title}`,
    );

    // 3. Broadcast Update
    this.eventsGateway.sendToOrg(
      updatedMeeting.organizationId,
      'MEETING_UPDATED',
      updatedMeeting,
    );

    return updatedMeeting;
  }

  async remove(id: string, userId: string) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id } });
    if (!meeting || meeting.createdById !== userId) {
      throw new UnauthorizedException(
        'Only the creator can delete the meeting',
      );
    }

    // 3. LOG: Capture title before deletion
    await this.activityLogs.log(
      userId,
      'MEETING_DELETED',
      'Meeting',
      id,
      `Deleted meeting: ${meeting.title}`,
    );

    return this.prisma.meeting.delete({ where: { id } });
  }

  async joinMeeting(meetingId: string, userId: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');

    if (meeting.status === 'cancelled' || meeting.status === 'completed') {
      throw new BadRequestException(
        `Cannot join a meeting that is ${meeting.status}`,
      );
    }

    const existing = await this.prisma.meetingParticipant.findFirst({
      where: { meetingId, userId },
    });
    if (existing)
      throw new BadRequestException('You are already a participant');

    const participant = await this.prisma.meetingParticipant.create({
      data: { meetingId, userId, status: 'accepted' },
    });

    // 4. LOG: Participant Joined
    await this.activityLogs.log(
      userId,
      'MEETING_JOINED',
      'Meeting',
      meetingId,
      `Joined meeting: ${meeting.title}`,
    );
    // 4. Notify the Creator: "Someone just joined your meeting"
    this.eventsGateway.sendToUser(meeting.createdById, 'PARTICIPANT_JOINED', {
      meetingId,
      userId,
      message: `Someone joined ${meeting.title}`,
    });

    return participant;
  }
}
