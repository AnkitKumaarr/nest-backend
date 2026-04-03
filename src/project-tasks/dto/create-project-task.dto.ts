import {
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

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
  inChargeId?: string;

  @IsOptional()
  @IsString()
  inChargeName?: string;

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

  @IsOptional()
  @IsString()
  teamName?: string;

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
  @IsDateString()
  assignDate?: string;
}
