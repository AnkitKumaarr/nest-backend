import { IsBoolean, IsIn, IsNotEmpty } from 'class-validator';

export class UpdateExtensionsDto {
  @IsBoolean()
  @IsNotEmpty()
  floatingIcon: boolean;

  @IsBoolean()
  @IsNotEmpty()
  autoPinExtension: boolean;

  @IsIn(['bottomRight', 'bottomLeft'])
  iconPosition: string;
}
