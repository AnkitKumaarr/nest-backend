import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

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
}
