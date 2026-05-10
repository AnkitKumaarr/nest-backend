import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { IsArray, IsString } from 'class-validator';
import { FileManagerService } from './file-manager.service';
import { CustomAuthGuard } from '../auth/guards/auth.guard';
import { UpdateFileDto } from './dto/update-file.dto';
import { ListFilesDto } from './dto/list-files.dto';
import { CreateFileDto } from './dto/create-file.dto';

class DeleteManyDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}

@Controller('file-manager')
@UseGuards(CustomAuthGuard)
export class FileManagerController {
  constructor(private readonly fileManagerService: FileManagerService) {}

  /** POST /api/v1/file-manager — upload one or more files */
  @Post()
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: diskStorage({
        destination: './uploads/files',
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname);
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB per file
    }),
  )
  create(
    @Request() req,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: CreateFileDto,
  ) {
    if (!files?.length) throw new BadRequestException('No files uploaded');
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.fileManagerService.createMany(req.user.sub, files, dto.folder, baseUrl);
  }

  /** GET /api/v1/file-manager */
  @Get()
  findAll(@Request() req, @Query() dto: ListFilesDto) {
    return this.fileManagerService.findAll(req.user.sub, dto);
  }

  /** GET /api/v1/file-manager/:id */
  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.fileManagerService.findOne(req.user.sub, id);
  }

  /** PATCH /api/v1/file-manager/:id */
  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateFileDto) {
    return this.fileManagerService.update(req.user.sub, id, dto);
  }

  /** DELETE /api/v1/file-manager/bulk — delete multiple files */
  @Delete('bulk')
  @HttpCode(HttpStatus.OK)
  removeMany(@Request() req, @Body() dto: DeleteManyDto) {
    return this.fileManagerService.removeMany(req.user.sub, dto.ids);
  }

  /** DELETE /api/v1/file-manager/:id — delete a single file */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Request() req, @Param('id') id: string) {
    return this.fileManagerService.remove(req.user.sub, id);
  }
}
