import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSocialLinksDto } from './dto/update-social-links.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { UsersService } from './users.service';
import { CustomAuthGuard } from '../auth/guards/auth.guard';

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
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  // ─── Static routes (must come before /:id) ────────────────────────────────

  /** GET /api/users/participants */
  @Get('participants')
  @UseGuards(CustomAuthGuard)
  getParticipants(@Query() query: ParticipantsQueryDto) {
    return this.userService.getParticipants(query.search, query.limit);
  }

  /** GET /api/users/profile */
  @Get('profile')
  @UseGuards(CustomAuthGuard)
  getProfile(@Request() req) {
    return this.userService.getProfile(req.user.sub);
  }

  /** PATCH /api/users/profile */
  @Patch('profile')
  @UseGuards(CustomAuthGuard)
  updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.sub, dto);
  }

  /** PATCH /api/users/social-links */
  @Patch('social-links')
  @UseGuards(CustomAuthGuard)
  updateSocialLinks(@Request() req, @Body() dto: UpdateSocialLinksDto) {
    return this.userService.updateSocialLinks(req.user.sub, dto.socialLinks);
  }

  /** POST /api/users/avatar — multipart upload */
  @Post('avatar')
  @UseGuards(CustomAuthGuard)
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

  /** DELETE /api/users/account */
  @Delete('account')
  @UseGuards(CustomAuthGuard)
  deleteAccount(@Request() req, @Body() dto: DeleteAccountDto) {
    return this.userService.deleteAccount(req.user.sub, dto.confirmation);
  }

  // ─── Admin / internal CRUD ────────────────────────────────────────────────

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Post('list')
  findAll(@Body() dto: ListUsersDto) {
    return this.userService.findAll(dto.page ?? 1, dto.limit ?? 25, dto.search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
