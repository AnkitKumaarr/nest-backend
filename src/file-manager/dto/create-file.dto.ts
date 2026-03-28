import { IsOptional, IsString } from 'class-validator';

export class CreateFileDto {
  @IsOptional()
  @IsString()
  folder?: string;

  @IsOptional()
  @IsString()
  name?: string;
}
