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
    await this.prisma.user.create({
      data: {
        ...createUserDto,
        lastName: createUserDto.lastName || null,
        fullName: this.generateFullName(
          createUserDto.firstName,
          createUserDto.lastName,
        ),
      },
    });

    return { message: 'User created successfully' };
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
      if (!currentUser)
        throw new NotFoundException(`User with ID ${id} not found`);

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

    await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    return { message: 'Profile updated successfully' };
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
      fullName: user.fullName,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      location: user.location ?? null,
      jobPost: user.jobPost ?? null,
      studyAt: user.studyAt ?? null,
      about: user.about ?? null,
      avatarUrl: user.avatarUrl ?? null,
      socialLinks: user.socialLinks ?? [],
    };
  }

  async updateProfile(
    userId: string,
    dto: {
      firstName?: string;
      lastName?: string;
      email?: string;
      location?: string;
      jobPost?: string;
      studyAt?: string;
      about?: string;
    },
  ) {
    const data: any = {};
    if (dto.firstName !== undefined || dto.lastName !== undefined) {
      const fullName = [dto.firstName, dto.lastName].filter(Boolean).join(' ');
      data.fullName = fullName || null;
      data.firstName = dto.firstName ?? null;
      data.lastName = dto.lastName ?? null;
    }
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.location !== undefined) data.location = dto.location;
    if (dto.jobPost !== undefined) data.jobPost = dto.jobPost;
    if (dto.studyAt !== undefined) data.studyAt = dto.studyAt;
    if (dto.about !== undefined) data.about = dto.about;

    await this.prisma.user.update({
      where: { id: userId },
      data,
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
        updatedAt: true,
      },
    });

    return { message: 'Profile updated successfully' };
  }

  async updateSocialLinks(
    userId: string,
    socialLinks: { platform: string; url: string }[],
  ) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { socialLinks: socialLinks as any },
    });

    return { message: 'Social links updated successfully' };
  }

  async uploadAvatar(userId: string, filename: string, baseUrl: string) {
    const avatarUrl = `${baseUrl}/uploads/avatars/${filename}`;
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });
    return { message: 'Avatar uploaded successfully' };
  }

  async deleteAccount(userId: string, confirmation: string) {
    if (confirmation !== 'DELETE') {
      throw new BadRequestException(
        'Confirmation text must be exactly "DELETE"',
      );
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
