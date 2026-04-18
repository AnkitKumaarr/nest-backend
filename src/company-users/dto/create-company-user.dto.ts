import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCompanyUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsString()
  roleId: string;

  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsArray()
  permissionsOverride?: string[];
}
