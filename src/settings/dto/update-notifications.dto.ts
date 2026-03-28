import { IsBoolean, IsIn, IsNotEmpty } from 'class-validator';

export class UpdateNotificationsDto {
  @IsBoolean()
  @IsNotEmpty()
  taskReminders: boolean;

  @IsBoolean()
  @IsNotEmpty()
  meetingReminders: boolean;

  @IsBoolean()
  @IsNotEmpty()
  challengeUpdates: boolean;

  @IsBoolean()
  @IsNotEmpty()
  systemUpdates: boolean;

  @IsIn(['realtime', 'daily', 'weekly'])
  frequency: string;
}
