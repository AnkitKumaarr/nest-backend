import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from 'src/gateways/events.gateway';

@Injectable()
export class ActivityLogsService {
  constructor(
    private eventsGateway: EventsGateway,
    private prisma: PrismaService,
  ) {}

  async log(
    userId: string,
    action: string,
    entity: string,
    entityId?: string,
    details?: string,
  ) {
    const log = await this.prisma.activityLog.create({
      data: { userId, action, entity, entityId, details },
      include: {
        user: {
          select: { firstName: true, lastName: true, organizationId: true },
        },
      },
    });
    if (log.user?.organizationId) {
      this.eventsGateway.sendToOrg(
        log.user.organizationId,
        'NEW_ACTIVITY_LOG',
        log,
      );
    }

    return log;
  }

  async findAll(userId: string, role: string) {
    const filter = role === 'admin' ? {} : { userId };
    return this.prisma.activityLog.findMany({
      where: filter,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
