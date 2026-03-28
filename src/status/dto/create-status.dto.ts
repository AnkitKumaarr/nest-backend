import { IsNotEmpty, IsString } from 'class-validator';

export class CreateStatusDto {
  @IsNotEmpty()
  @IsString()
  label: string;
}

export class UpdateStatusDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  label: string;
}
