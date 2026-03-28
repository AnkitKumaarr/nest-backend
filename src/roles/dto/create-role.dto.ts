import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateRoleDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}
