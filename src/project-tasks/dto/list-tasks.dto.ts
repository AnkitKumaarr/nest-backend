import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class DateFilterDto {
  @IsIn(['date'])
  type: 'date';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

class UsersFilterDto {
  @IsIn(['users'])
  type: 'users';

  @IsArray()
  @IsString({ each: true })
  userId: string[];
}

class TaskFilterDto {
  @IsIn(['date', 'users'])
  type: 'date' | 'users';

  // date filter fields
  @ValidateIf((o) => o.type === 'date')
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ValidateIf((o) => o.type === 'date')
  @IsOptional()
  @IsDateString()
  endDate?: string;

  // users filter fields
  @ValidateIf((o) => o.type === 'users')
  @IsArray()
  @IsString({ each: true })
  userId?: string[];
}

export class ListTasksDto {
  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsString()
  taskId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskFilterDto)
  filters?: TaskFilterDto[];
}
