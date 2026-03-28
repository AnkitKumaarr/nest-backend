import { IsDateString, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class TeamFiltersDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class ListTeamsDto {
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
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => TeamFiltersDto)
  filters?: TeamFiltersDto;
}

export class ListMembersDto {
  @IsNotEmpty()
  @IsString()
  teamId: string;

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
  @IsObject()
  @ValidateNested()
  @Type(() => TeamFiltersDto)
  filters?: TeamFiltersDto;
}
