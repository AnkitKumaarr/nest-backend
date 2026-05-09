import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTaskPriorityDto {
  @IsNotEmpty()
  @IsString()
  label: string;
}

export class UpdateTaskPriorityDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  label: string;
}
