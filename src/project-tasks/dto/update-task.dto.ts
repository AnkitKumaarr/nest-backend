import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { TaskPriority, TaskStatus } from './create-project-task.dto';

export class UpdateTaskDto {
  @IsNotEmpty()
  @IsString()
  taskId: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  columnId?: string;

  @IsOptional()
  @IsString()
  inchargeId?: string;

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
}
