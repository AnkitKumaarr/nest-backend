import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SocialLinkItemDto {
  @IsString()
  platform: string;

  @IsString()
  url: string;
}

export class UpdateSocialLinksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialLinkItemDto)
  socialLinks: SocialLinkItemDto[];
}
