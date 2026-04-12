import { IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateWeekDto {
  @IsString()
  @IsNotEmpty()
  @Type(() => String)
  id: string;

  @IsString()
  @IsNotEmpty()
  @Type(() => String)
  weekId: string;
}
