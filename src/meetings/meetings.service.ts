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

  private mapMeetingResponse(meeting: any) {
    return {
      id: meeting.id,
      title: meeting.title,
      description: meeting.description,
      startTime: meeting.startTime.toISOString(),
      endTime: meeting.endTime.toISOString(),
      meetingLink: meeting.meetingLink,
      isRecurring: meeting.isRecurring,
      recurringDays: meeting.recurringDays || [],
      meetingType: meeting.meetingType,
      status: meeting.status,
      participants: (meeting.participants || []).map((p: any) => ({
        id: p.user.id,
        name:
          p.user.fullName ||
          `${p.user.firstName} ${p.user.lastName || ''}`.trim(),
        email: p.user.email,
      })),
    };
  }

  async create(dto: CreateMeetingDto, userId: string, orgId: string) {
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);

    if (start >= end) {
      throw new BadRequestException('End time must be after start time');
    }

    const { participantIds, ...meetingData } = dto;

    // Check for scheduling conflicts for the creator
    const conflict = await this.prisma.meeting.findFirst({
      where: {
        createdBy: userId,
        status: { not: 'cancelled' },
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
        ...meetingData,
        startTime: start,
        endTime: end,
        companyId: orgId,
        createdBy: userId,
        participants: {
          create: participantIds.map((id) => ({
            userId: id,
            status: 'pending',
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    await this.activityLogs.log(
      this.prisma,
      userId,
      'MEETING_CREATED',
      'Meeting',
      meeting.id,
      `Created meeting: ${meeting.title}`,
    );

    const response = this.mapMeetingResponse(meeting);
    this.eventsGateway.sendToOrg(orgId, 'MEETING_CREATED', response);

    return response;
  }

  async findAll(userId: string) {
    const meetings = await this.prisma.meeting.findMany({
      where: {
        OR: [{ createdBy: userId }, { participants: { some: { userId } } }],
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return meetings.map((m) => this.mapMeetingResponse(m));
  }

  async findOne(id: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');
    return this.mapMeetingResponse(meeting);
  }

  async update(id: string, dto: any, userId: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
      include: { participants: true },
    });
    if (!meeting || meeting.createdBy !== userId) {
      throw new UnauthorizedException(
        'Only the creator can update the meeting',
      );
    }

    const { participantIds, ...updateData } = dto;

    // Handle participant updates if provided
    let participantsUpdate = {};
    if (participantIds) {
      // Delete all and recreate for simplicity
      await this.prisma.meetingParticipant.deleteMany({
        where: { meetingId: id },
      });
      participantsUpdate = {
        participants: {
          create: (participantIds as string[]).map((pid: string) => ({
            userId: pid,
            status: 'pending',
          })),
        },
      };
    }

    const updatedMeeting = await this.prisma.meeting.update({
      where: { id },
      data: {
        ...updateData,
        ...(dto.startTime && { startTime: new Date(dto.startTime) }),
        ...(dto.endTime && { endTime: new Date(dto.endTime) }),
        ...participantsUpdate,
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    const action =
      dto.status === 'cancelled' ? 'MEETING_CANCELLED' : 'MEETING_UPDATED';
    await this.activityLogs.log(
      this.prisma,
      userId,
      action,
      'Meeting',
      id,
      `Updated meeting: ${updatedMeeting.title}`,
    );

    const response = this.mapMeetingResponse(updatedMeeting);
    this.eventsGateway.sendToOrg(
      updatedMeeting.companyId,
      'MEETING_UPDATED',
      response,
    );

    return response;
  }

  async remove(id: string, userId: string) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id } });
    if (!meeting || meeting.createdBy !== userId) {
      throw new UnauthorizedException(
        'Only the creator can delete the meeting',
      );
    }

    await this.activityLogs.log(
      this.prisma,
      userId,
      'MEETING_DELETED',
      'Meeting',
      id,
      `Deleted meeting: ${meeting.title}`,
    );

    await this.prisma.meetingParticipant.deleteMany({
      where: { meetingId: id },
    });

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
      include: { user: true },
    });

    await this.activityLogs.log(
      this.prisma,
      userId,
      'MEETING_JOINED',
      'Meeting',
      meetingId,
      `Joined meeting: ${meeting.title}`,
    );

    this.eventsGateway.sendToUser(meeting.createdBy, 'PARTICIPANT_JOINED', {
      meetingId,
      userId,
      userName:
        participant.user.fullName ||
        `${participant.user.firstName} ${participant.user.lastName || ''}`.trim(),
      message: `${participant.user.firstName} joined ${meeting.title}`,
    });

    return participant;
  }
}
