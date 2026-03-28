import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListNotificationsDto, TAB_TYPE_MAP, NotificationTabType } from './dto/list-notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private typeFilter(tab: NotificationTabType | undefined) {
    const keyword = TAB_TYPE_MAP[tab ?? 'all'];
    return keyword ? { type: { contains: keyword, mode: 'insensitive' as const } } : {};
  }

  private async assertOwnership(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (!notification) throw new NotFoundException('Notification not found or access denied');
    return notification;
  }

  // ── 1. List — paginated, filterable by type and read status ─────────────────

  async findAll(userId: string, dto: ListNotificationsDto) {
    const { page = 1, limit = 25, type = 'all', read } = dto;
    const skip = (page - 1) * limit;

    const baseWhere = { userId };
    const typeWhere = this.typeFilter(type);
    const readWhere = read !== undefined ? { read } : {};

    const where = { ...baseWhere, ...typeWhere, ...readWhere };

    // Paginated results + total for current filter in parallel
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    // Tab counts — always scoped to userId only (no read filter applied)
    const [allCount, tasksCount, meetingsCount, systemCount, mentionsCount] = await Promise.all([
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, ...this.typeFilter('tasks') } }),
      this.prisma.notification.count({ where: { userId, ...this.typeFilter('meetings') } }),
      this.prisma.notification.count({ where: { userId, ...this.typeFilter('system') } }),
      this.prisma.notification.count({ where: { userId, ...this.typeFilter('mentions') } }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      counts: {
        all: allCount,
        tasks: tasksCount,
        meetings: meetingsCount,
        system: systemCount,
        mentions: mentionsCount,
      },
    };
  }

  // ── 2. Mark one as read ──────────────────────────────────────────────────────

  async markAsRead(id: string, userId: string) {
    await this.assertOwnership(id, userId);
    return this.prisma.notification.update({ where: { id }, data: { read: true } });
  }

  // ── 3. Mark one as unread ────────────────────────────────────────────────────

  async markAsUnread(id: string, userId: string) {
    await this.assertOwnership(id, userId);
    return this.prisma.notification.update({ where: { id }, data: { read: false } });
  }

  // ── 4. Mark all as read ──────────────────────────────────────────────────────

  async markAllAsRead(userId: string) {
    const { count } = await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { message: `${count} notification(s) marked as read` };
  }

  // ── 5. Delete one ────────────────────────────────────────────────────────────

  async remove(id: string, userId: string) {
    await this.assertOwnership(id, userId);
    await this.prisma.notification.delete({ where: { id } });
    return { message: 'Notification deleted' };
  }

  // ── 6. Delete all ────────────────────────────────────────────────────────────

  async removeAll(userId: string) {
    const { count } = await this.prisma.notification.deleteMany({ where: { userId } });
    return { message: `${count} notification(s) deleted` };
  }
}
