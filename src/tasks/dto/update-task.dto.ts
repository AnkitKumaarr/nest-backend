import { IsString, IsOptional, IsEnum, IsMongoId, IsNotEmpty } from 'class-validator';
import { TaskStatus, TaskPriority } from './create-task.dto';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  date?: string; // Format: DD-MM-YYYY

  @IsString()
  @IsOptional()
  dueDate?: string; // Format: DD-MM-YYYY

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsString()
  @IsOptional()
  blocker?: string; // e.g., "Waiting for approval"

  @IsOptional()
  @IsMongoId()
  assignedToId?: string;

  @IsMongoId()
  @IsNotEmpty()
  taskId: string; // Required: Task ID to update
}
