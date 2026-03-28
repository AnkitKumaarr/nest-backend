import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private generateFullName(firstName: string, lastName?: string): string {
    return lastName ? `${firstName} ${lastName}` : firstName;
  }

  async create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        ...createUserDto,
        lastName: createUserDto.lastName || null,
        fullName: this.generateFullName(
          createUserDto.firstName,
          createUserDto.lastName,
        ),
      },
    });
  }

  async findAll(page = 1, limit = 25, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { fullName: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [data, totalRecords] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          role: true,
          department: true,
          status: true,
          companyId: true,
          isEmailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, meta: { page, limit, totalRecords } };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const updateData: any = { ...updateUserDto };

    if (updateUserDto.firstName || updateUserDto.lastName) {
      const currentUser = await this.prisma.user.findUnique({ where: { id } });
      if (!currentUser) throw new NotFoundException(`User with ID ${id} not found`);

      const firstName = updateUserDto.firstName || currentUser.firstName;
      const lastName =
        updateUserDto.lastName !== undefined
          ? updateUserDto.lastName
          : currentUser.lastName;
      updateData.fullName = this.generateFullName(
        firstName || '',
        lastName || undefined,
      );
    }

    return this.prisma.user.update({ where: { id }, data: updateData });
  }

  async remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

  // ─── Profile APIs ─────────────────────────────────────────────────────────

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        firstName: true,
        lastName: true,
        email: true,
        location: true,
        jobPost: true,
        studyAt: true,
        about: true,
        avatarUrl: true,
        socialLinks: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    return {
      id: user.id,
      name: user.fullName ?? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
      email: user.email,
      location: user.location ?? null,
      jobPost: user.jobPost ?? null,
      studyAt: user.studyAt ?? null,
      about: user.about ?? null,
      avatarUrl: user.avatarUrl ?? null,
      socialLinks: (user.socialLinks as any[]) ?? [],
    };
  }

  async updateProfile(
    userId: string,
    dto: {
      name?: string;
      email?: string;
      location?: string;
      jobPost?: string;
      studyAt?: string;
      about?: string;
    },
  ) {
    const data: any = {};
    if (dto.name !== undefined) {
      data.fullName = dto.name;
      const parts = dto.name.trim().split(' ');
      data.firstName = parts[0];
      data.lastName = parts.slice(1).join(' ') || null;
    }
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.location !== undefined) data.location = dto.location;
    if (dto.jobPost !== undefined) data.jobPost = dto.jobPost;
    if (dto.studyAt !== undefined) data.studyAt = dto.studyAt;
    if (dto.about !== undefined) data.about = dto.about;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        fullName: true,
        email: true,
        location: true,
        jobPost: true,
        studyAt: true,
        about: true,
        updatedAt: true,
      },
    });

    return {
      id: updated.id,
      name: updated.fullName,
      email: updated.email,
      location: updated.location,
      jobPost: updated.jobPost,
      studyAt: updated.studyAt,
      about: updated.about,
      updatedAt: updated.updatedAt,
    };
  }

  async updateSocialLinks(
    userId: string,
    socialLinks: { platform: string; url: string }[],
  ) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { socialLinks: socialLinks as any },
      select: { socialLinks: true, updatedAt: true },
    });

    return {
      socialLinks: (updated.socialLinks as any[]) ?? [],
      updatedAt: updated.updatedAt,
    };
  }

  async uploadAvatar(userId: string, filename: string, baseUrl: string) {
    const avatarUrl = `${baseUrl}/uploads/avatars/${filename}`;
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });
    return { avatarUrl };
  }

  async deleteAccount(userId: string, confirmation: string) {
    if (confirmation !== 'DELETE') {
      throw new BadRequestException('Confirmation text must be exactly "DELETE"');
    }
    await this.prisma.user.delete({ where: { id: userId } });
    return { message: 'Account deleted successfully' };
  }

  // ─── Participants dropdown ─────────────────────────────────────────────────

  async getParticipants(search?: string, limit = 50) {
    const where: any = search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const users = await this.prisma.user.findMany({
      where,
      take: limit,
      orderBy: { fullName: 'asc' },
      select: {
        id: true,
        fullName: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
      },
    });

    return users.map((u) => {
      const name =
        u.fullName ?? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
      const initials = name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('');
      return { id: u.id, name, email: u.email, avatar: u.avatarUrl, initials };
    });
  }
}
