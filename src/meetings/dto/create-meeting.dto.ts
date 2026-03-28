import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsArray,
  IsInt,
  IsIn,
  Min,
  Max,
  ValidateIf,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export const MEETING_TYPES = ['google_meet', 'zoom', 'teams', 'other'] as const;

export class CreateMeetingDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  meetingLink?: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsArray()
  @IsString({ each: true })
  participantIds: string[];

  @IsBoolean()
  isRecurring: boolean;

  @ValidateIf((o) => o.isRecurring === true)
  @IsArray()
  @ArrayMinSize(1)
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
