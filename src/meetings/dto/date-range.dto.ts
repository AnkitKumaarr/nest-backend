import { IsOptional, IsDateString, IsString, IsIn } from 'class-validator';

export class DateRangeDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class ParticipationTrendDto extends DateRangeDto {
  @IsOptional()
  @IsString()
  @IsIn(['day', 'week'])
  groupBy?: 'day' | 'week' = 'week';
}
