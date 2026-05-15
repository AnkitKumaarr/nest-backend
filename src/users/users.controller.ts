import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSocialLinksDto } from './dto/update-social-links.dto';
import { UsersService } from './users.service';
import { CustomAuthGuard } from '../auth/guards/auth.guard';
import {
  ReadThrottle,
  WriteThrottle,
  UploadThrottle,
  SkipThrottle,
} from '../common/decorators/throttle.decorator';

class ParticipantsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 50;
}

@Controller('users')
@UseGuards(CustomAuthGuard)
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  /** GET /api/v1/users */
  @ReadThrottle()
  @Get()
  findAll(@Query('page') page = 1, @Query('limit') limit = 25, @Query('search') search?: string) {
    return this.userService.findAll(Number(page), Number(limit), search);
  }

  /** GET /api/v1/users/profile */
  @SkipThrottle()
  @Get('profile')
  getProfile(@Request() req) {
    return this.userService.getProfile(req.user.sub);
  }

  /** GET /api/v1/users/participants */
  @ReadThrottle()
  @Get('participants')
  getParticipants(@Query() query: ParticipantsQueryDto) {
    return this.userService.getParticipants(query.search, query.limit);
  }

  /** PATCH /api/v1/users/profile */
  @WriteThrottle()
  @Patch('profile')
  updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.sub, dto);
  }

  /** PATCH /api/v1/users/social-links */
  @WriteThrottle()
  @Patch('social-links')
  updateSocialLinks(@Request() req, @Body() dto: UpdateSocialLinksDto) {
    return this.userService.updateSocialLinks(req.user.sub, dto.socialLinks);
  }

  /** DELETE /api/v1/users/profile */
  @WriteThrottle()
  @Delete('profile')
  deleteAccount(@Request() req) {
    return this.userService.deleteAccount(req.user.sub, 'DELETE');
  }

  /** POST /api/v1/users/avatar */
  @UploadThrottle()
  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req: any, file, cb) => {
          const ext = extname(file.originalname);
          cb(null, `${req.user.sub}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only JPEG, PNG, or WebP images allowed'), false);
        }
      },
    }),
  )
  uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.userService.uploadAvatar(req.user.sub, file.filename, baseUrl);
  }

  /** PATCH /api/v1/users/:userId */
  @WriteThrottle()
  @Patch(':userId')
  update(@Param('userId') userId: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(userId, dto);
  }
}
