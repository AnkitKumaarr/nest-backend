import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePriorityDto {
  @IsNotEmpty()
  @IsString()
  label: string;
}

export class UpdatePriorityDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  label: string;
}
