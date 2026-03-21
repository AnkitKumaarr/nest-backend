import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SigninCompanyUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
