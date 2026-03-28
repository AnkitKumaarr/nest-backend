import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  jobPost?: string;

  @IsOptional()
  @IsString()
  studyAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  about?: string;
}
