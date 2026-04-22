import { IsOptional, IsDateString, IsString } from 'class-validator';

class DateRangeDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class OverviewDto {
  @IsOptional()
  dateRange?: DateRangeDto;

  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}
