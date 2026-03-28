import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateCompanyUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  roleId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
