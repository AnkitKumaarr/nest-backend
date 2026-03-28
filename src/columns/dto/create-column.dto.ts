import { IsNotEmpty, IsString } from 'class-validator';

export class CreateColumnDto {
  @IsNotEmpty()
  @IsString()
  label: string;
}

export class UpdateColumnDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  label: string;
}
