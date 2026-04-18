import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateTeamDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  managerId?: string;

  @IsOptional()
  @IsString()
  leadId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[];
}
