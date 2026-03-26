import { IsString, IsNotEmpty, IsOptional, IsDateString, IsBoolean, IsUrl } from 'class-validator';

export class CreateMeetingDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsUrl()
  meetingLink?: string;

  @IsString()
  @IsNotEmpty()
  status: string; // e.g., "scheduled", "ongoing", "completed"

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;
}