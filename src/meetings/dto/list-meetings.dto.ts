import { IsOptional, IsString, IsInt, IsIn, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export const MEETING_STATUSES = ['All', 'Upcoming', 'Ongoing', 'Completed', 'Canceled'] as const;

export class ListMeetingsDto {
  @IsOptional()
  @IsString()
  @IsIn(MEETING_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20;
}
