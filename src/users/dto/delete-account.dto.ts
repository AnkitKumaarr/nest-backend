import { IsString, IsNotEmpty } from 'class-validator';

export class DeleteAccountDto {
  @IsString()
  @IsNotEmpty()
  confirmation: string;
}
