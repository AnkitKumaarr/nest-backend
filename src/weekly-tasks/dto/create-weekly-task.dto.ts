import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWeeklyTaskDto {
  @IsOptional()
  @IsString()
  weekId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  dayId?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  blocker?: string;

  @IsOptional()
  @IsString()
  assignedTo?: string;
}
