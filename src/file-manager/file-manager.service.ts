import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateFileDto } from './dto/update-file.dto';
import { ListFilesDto } from './dto/list-files.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileManagerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    file: Express.Multer.File,
    folder: string | undefined,
    customName: string | undefined,
    baseUrl: string,
  ) {
    const url = `${baseUrl}/uploads/files/${file.filename}`;
    const record = await this.prisma.fileManager.create({
      data: {
        userId,
        url,
        name: customName ?? file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        folder: folder ?? null,
      },
    });
    return record;
  }

  async findAll(userId: string, dto: ListFilesDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (dto.folder) where.folder = dto.folder;
    if (dto.search) where.name = { contains: dto.search, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      this.prisma.fileManager.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.fileManager.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(userId: string, id: string) {
    const file = await this.prisma.fileManager.findUnique({ where: { id } });
    if (!file) throw new NotFoundException('File not found');
    if (file.userId !== userId) throw new ForbiddenException('Access denied');
    return file;
  }

  async update(userId: string, id: string, dto: UpdateFileDto) {
    const file = await this.findOne(userId, id);
    return this.prisma.fileManager.update({
      where: { id: file.id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.folder !== undefined && { folder: dto.folder }),
      },
    });
  }

  async remove(userId: string, id: string) {
    const file = await this.findOne(userId, id);

    // Delete physical file from disk
    const filename = file.url.split('/uploads/files/').pop();
    if (filename) {
      const filePath = path.join(process.cwd(), 'uploads', 'files', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await this.prisma.fileManager.delete({ where: { id: file.id } });
    return { message: 'File deleted successfully' };
  }
}
