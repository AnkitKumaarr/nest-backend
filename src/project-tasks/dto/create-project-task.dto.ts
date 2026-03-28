import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
}

export class CreateProjectTaskDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  teamId: string;

  @IsOptional()
  @IsString()
  columnId?: string;

  @IsOptional()
  @IsString()
  creatorId?: string;

  @IsOptional()
  @IsString()
  creatorName?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  inchargeId?: string;

  @IsOptional()
  @IsString()
  inchargeName?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  // Accepted formats: "2h 30mins", "2 hours 30 mins", "2 days", "2days"
  @IsOptional()
  @IsString()
  logTime?: string;

  @IsOptional()
  @IsObject()
  taskContent?: object;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsDateString()
  assignDate?: string;
}
