import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateWeeklyTaskDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  weekId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  descriptionHtml?: string;

  @IsOptional()
  @IsString()
  descPreview?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

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
  blockerHtml?: string;

  @IsOptional()
  @IsString()
  blockerPreview?: string;

  @IsOptional()
  @IsString()
  assignedTo?: string;
}
