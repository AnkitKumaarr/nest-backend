import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateTaskDto {
  @IsNotEmpty()
  @IsString()
  taskId: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  inChargeId?: string;

  @IsOptional()
  @IsString()
  priorityId?: string;

  @IsOptional()
  @IsString()
  priorityName?: string;

  @IsOptional()
  @IsString()
  statusId?: string;

  @IsOptional()
  @IsString()
  statusName?: string;

  // Accepted formats: "2h 30mins", "2 hours 30 mins", "2 days", "2days"
  @IsOptional()
  @IsString()
  logTime?: string;

  @IsOptional()
  @IsObject()
  taskContent?: object;

  @IsOptional()
  @IsString()
  renderedHtml?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsNumber()
  position?: number;
}
