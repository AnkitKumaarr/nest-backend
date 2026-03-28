import {
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsArray,
  IsInt,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MEETING_TYPES } from './create-meeting.dto';

export class UpdateMeetingDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  meetingLink?: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participantIds?: string[];

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  @Type(() => Number)
  recurringDays?: number[];

  @IsOptional()
  @IsString()
  @IsIn(MEETING_TYPES)
  meetingType?: string;
}
