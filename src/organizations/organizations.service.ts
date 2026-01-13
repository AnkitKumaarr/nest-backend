import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { EventsGateway } from 'src/gateways/events.gateway';

@Injectable()
export class OrganizationsService {
  constructor(
    private eventsGateway: EventsGateway,
    private prisma: PrismaService,
    private activityLogs: ActivityLogsService,
  ) {}

  async create(name: string, userId: string) {
    // 1. Create a URL-friendly slug (e.g., "My Company" -> "my-company")
    const slug = name
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');

    // 2. Check if slug is unique
    const existing = await this.prisma.organization.findUnique({
      where: { slug },
    });
    if (existing)
      throw new ConflictException('Organization name or slug already taken');

    const result = await this.prisma.$transaction(async (tx) => {
      // 3. Create the Organization
      const org = await tx.organization.create({
        data: { name, slug },
      });

      // 4. Update the User to be a member/admin of this Org
      await tx.user.update({
        where: { id: userId },
        data: {
          organizationId: org.id,
          role: 'admin', // The creator becomes the admin
        },
      });

      // 5. Log the activity
      await this.activityLogs.log(
        userId,
        'ORG_CREATED',
        'Organization',
        org.id,
        `Created ${name}`,
      );

      return org;
    });
    this.eventsGateway.sendToUser(userId, 'ORG_JOINED', {
      orgId: result.id,
      role: 'admin',
      message: `Welcome to ${result.name}`,
    });

    return result;
  }

  async getMyOrganization(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        members: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }
}
