import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';
import { CreateCompanyUserDto } from './dto/create-company-user.dto';
import { UpdateCompanyUserDto } from './dto/update-company-user.dto';

@Injectable()
export class CompanyUsersService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  private generateTempPassword(): string {
    return crypto.randomBytes(8).toString('hex'); // 16-char hex string
  }

  async create(dto: CreateCompanyUserDto, companyId: string) {
    const existing = await this.prisma.companyUser.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException({
        success: false,
        message: 'Email already registered',
        code: 'USER_EXISTS',
      });
    }

    // Verify role belongs to this company
    const role = await this.prisma.role.findFirst({
      where: { id: dto.roleId, companyId },
    });
    if (!role) throw new NotFoundException('Role not found in this company');

    const tempPassword = this.generateTempPassword();
    const hashedTemp = await bcrypt.hash(tempPassword, 12);
    const tempPasswordExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const user = await this.prisma.companyUser.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        companyId,
        roleId: dto.roleId,
        tempPassword: hashedTemp,
        tempPasswordExpiry,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        companyId: true,
        roleId: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Send temp password email
    try {
      await this.mailService.sendTempPassword(dto.email, dto.firstName, tempPassword);
    } catch {
      console.error('Failed to send temp password email');
    }

    return { ...user, message: 'User created. Temporary password sent to email.' };
  }

  async regenerateTempPassword(id: string, companyId: string) {
    const user = await this.prisma.companyUser.findFirst({
      where: { id, companyId, isDeleted: false },
    });
    if (!user) throw new NotFoundException('User not found');

    const tempPassword = this.generateTempPassword();
    const hashedTemp = await bcrypt.hash(tempPassword, 12);
    const tempPasswordExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.companyUser.update({
      where: { id },
      data: {
        tempPassword: hashedTemp,
        tempPasswordExpiry,
        hasChangedPassword: false,
      },
    });

    try {
      await this.mailService.sendTempPassword(user.email, user.firstName, tempPassword);
    } catch {
      console.error('Failed to send temp password email');
    }

    return { message: 'Temporary password regenerated and sent to email.' };
  }

  async findAll(companyId: string, page = 1, limit = 50, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = { companyId, isDeleted: false };
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.companyUser.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          createdAt: true,
          role: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.companyUser.count({ where }),
    ]);

    return { users, meta: { page, limit, total } };
  }

  async findOne(id: string, companyId: string) {
    const user = await this.prisma.companyUser.findFirst({
      where: { id, companyId, isDeleted: false },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        role: { select: { id: true, name: true, permissions: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateCompanyUserDto, companyId: string) {
    const user = await this.prisma.companyUser.findFirst({
      where: { id, companyId, isDeleted: false },
    });
    if (!user) throw new NotFoundException('User not found');

    if (dto.roleId) {
      const role = await this.prisma.role.findFirst({
        where: { id: dto.roleId, companyId },
      });
      if (!role) throw new NotFoundException('Role not found in this company');
    }

    return this.prisma.companyUser.update({
      where: { id },
      data: {
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.roleId && { roleId: dto.roleId }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string, companyId: string) {
    const user = await this.prisma.companyUser.findFirst({
      where: { id, companyId, isDeleted: false },
    });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.companyUser.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    });

    return { message: 'User deleted successfully' };
  }

  async signin(email: string, password: string) {
    const user = await this.prisma.companyUser.findUnique({
      where: { email },
      include: { role: { select: { id: true, name: true, permissions: true } } },
    });

    if (!user || user.isDeleted || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Try temp password first
    let isTempLogin = false;
    if (user.tempPassword) {
      const isTempMatch = await bcrypt.compare(password, user.tempPassword);
      if (isTempMatch) {
        // Check expiry
        if (!user.tempPasswordExpiry || user.tempPasswordExpiry < new Date()) {
          throw new UnauthorizedException({
            success: false,
            message: 'Temporary password has expired',
            code: 'TEMP_PASS_EXPIRED',
            errors: ['Please ask your Company Admin to regenerate password'],
          });
        }
        if (user.hasChangedPassword) {
          throw new BadRequestException({
            success: false,
            message: 'Temporary password has already been used',
            code: 'TEMP_PASS_USED',
          });
        }
        isTempLogin = true;
      }
    }

    // Try regular password if not temp
    if (!isTempLogin) {
      if (!user.password) {
        throw new UnauthorizedException('Invalid credentials');
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      type: 'company-user',
      companyId: user.companyId,
      roleId: user.roleId,
      role: user.role.name,
      permissions: user.role.permissions,
    };

    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn: '30d',
    });
    const refresh_token = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    return {
      access_token,
      refresh_token,
      requirePasswordChange: isTempLogin,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        companyId: user.companyId,
        role: user.role.name,
        permissions: user.role.permissions,
      },
    };
  }

  async changePassword(userId: string, newPassword: string) {
    const user = await this.prisma.companyUser.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.companyUser.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        tempPassword: null,
        tempPasswordExpiry: null,
        hasChangedPassword: true,
      },
    });

    return { message: 'Password changed successfully' };
  }
}
