import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateAccountStatusDto {
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}
