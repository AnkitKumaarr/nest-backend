import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityLogsService {
  constructor(private readonly prisma: PrismaService) {}

  // async log(
  //   userId: string,
  //   action: string,
  //   entity: string,
  //   entityId?: string,
  //   details?: string,
  // ) {
  //   const log = await this.prisma.activityLog.create({
  //     data: { userId, action, entity, entityId, details },
  //     include: {
  //       user: {
  //         select: { fullName: true, companyId: true },
  //       },
  //     },
  //   });
  //   if (log.user?.companyId) {
  //     this.eventsGateway.sendToOrg(
  //       log.user.companyId,
  //       'NEW_ACTIVITY_LOG',
  //       log,
  //     );
  //   }

  //   return log;
  // }

  async log(
    prisma: PrismaService  | any, // tx or prisma
    userId: string,
    action: string,
    entity: string,
    entityId?: string,
    details?: string,
  ) {
    const log = await prisma.activityLog.create({
      data: { userId, action, entity, entityId, details },
    });

    return log;
  }

  async findAll(userId: string, role: string) {
    const where = role === 'admin' ? {} : { userId };
    return this.prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
