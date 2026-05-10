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

  async createMany(
    userId: string,
    files: Express.Multer.File[],
    folder: string | undefined,
    baseUrl: string,
  ) {
    const records = await Promise.all(
      files.map((file) =>
        this.prisma.fileManager.create({
          data: {
            userId,
            url: `${baseUrl}/uploads/files/${file.filename}`,
            name: file.originalname,
            size: file.size,
            mimeType: file.mimetype,
            folder: folder ?? null,
          },
        }),
      ),
    );
    return { data: records, message: `${records.length} file(s) uploaded successfully` };
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

    return { data, meta: { page, limit, totalRecords: total } };
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
    this.deleteFromDisk(file.url);
    await this.prisma.fileManager.delete({ where: { id: file.id } });
    return { message: 'File deleted successfully' };
  }

  async removeMany(userId: string, ids: string[]) {
    const files = await Promise.all(ids.map((id) => this.findOne(userId, id)));
    files.forEach((f) => this.deleteFromDisk(f.url));
    await this.prisma.fileManager.deleteMany({ where: { id: { in: ids }, userId } });
    return { message: `${ids.length} file(s) deleted successfully` };
  }

  private deleteFromDisk(url: string) {
    const filename = url.split('/uploads/files/').pop();
    if (filename) {
      const filePath = path.join(process.cwd(), 'uploads', 'files', filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  }
}
