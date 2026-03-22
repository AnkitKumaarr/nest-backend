import { IsArray, IsDateString, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CreatedByDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  name: string;
}

export class AddTeamMembersDto {
  @IsNotEmpty()
  @IsString()
  teamId: string;

  @IsArray()
  @IsString({ each: true })
  members: string[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CreatedByDto)
  createdBy?: CreatedByDto;
}

class MemberFiltersDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class ListTeamMembersDto {
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
  @Type(() => MemberFiltersDto)
  filters?: MemberFiltersDto;
}
