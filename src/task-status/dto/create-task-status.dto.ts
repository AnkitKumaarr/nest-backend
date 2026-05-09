import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTaskStatusDto {
  @IsNotEmpty()
  @IsString()
  label: string;
}

export class UpdateTaskStatusDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  label: string;
}
