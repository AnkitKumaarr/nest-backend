import { IsOptional, IsInt, IsIn, IsBoolean, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export const NOTIFICATION_TAB_TYPES = ['all', 'tasks', 'meetings', 'system', 'mentions'] as const;
export type NotificationTabType = typeof NOTIFICATION_TAB_TYPES[number];

// Maps frontend tab id → substring matched against the DB `type` field
export const TAB_TYPE_MAP: Record<NotificationTabType, string | null> = {
  all:      null,
  tasks:    'TASK',
  meetings: 'MEETING',
  system:   'SYSTEM',
  mentions: 'MENTION',
};

export class ListNotificationsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 25;

  @IsOptional()
  @IsIn(NOTIFICATION_TAB_TYPES)
  type?: NotificationTabType = 'all';

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  read?: boolean;
}
