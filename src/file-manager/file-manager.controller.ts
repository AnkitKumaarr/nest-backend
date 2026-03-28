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
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { FileManagerService } from './file-manager.service';
import { CustomAuthGuard } from '../auth/guards/auth.guard';
import { UpdateFileDto } from './dto/update-file.dto';
import { ListFilesDto } from './dto/list-files.dto';
import { CreateFileDto } from './dto/create-file.dto';

@Controller('api/file-manager')
@UseGuards(CustomAuthGuard)
export class FileManagerController {
  constructor(private readonly fileManagerService: FileManagerService) {}

  /** POST /api/file-manager — upload a file */
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/files',
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname);
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    }),
  )
  create(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateFileDto,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.fileManagerService.create(
      req.user.sub,
      file,
      dto.folder,
      dto.name,
      baseUrl,
    );
  }

  /** GET /api/file-manager */
  @Get()
  findAll(@Request() req, @Query() dto: ListFilesDto) {
    return this.fileManagerService.findAll(req.user.sub, dto);
  }

  /** GET /api/file-manager/:id */
  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.fileManagerService.findOne(req.user.sub, id);
  }

  /** PATCH /api/file-manager/:id */
  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateFileDto,
  ) {
    return this.fileManagerService.update(req.user.sub, id, dto);
  }

  /** DELETE /api/file-manager/:id */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Request() req, @Param('id') id: string) {
    return this.fileManagerService.remove(req.user.sub, id);
  }
}
