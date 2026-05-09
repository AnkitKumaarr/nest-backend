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

  private async insertIntoTeamMember(companyUser: any, createdByUserId?: string, createdByFullName?: string) {
    try {
      if (!companyUser.teamId) return; // Only insert if teamId exists

      const team = await this.prisma.team.findUnique({
        where: { id: companyUser.teamId },
        select: { name: true },
      });

      if (!team) return;

      const isActive = companyUser.isActive && companyUser.hasChangedPassword;

      const data: any = {
        teamId: companyUser.teamId,
        teamName: team.name,
        companyId: companyUser.companyId,
        userId: companyUser.id,
        name: companyUser.fullName,
        isActive,
        roleId: companyUser.roleId,
        email: companyUser.email,
        role: companyUser.role?.name,
        isLoggedIn: false,
      };

      // Only include createdBy if both userId and fullName are provided
      if (createdByUserId && createdByFullName) {
        data.createdBy = {
          userId: createdByUserId,
          name: createdByFullName,
        };
      }

      await this.prisma.teamMember.create({ data });
    } catch (error) {
      console.error('Failed to insert into TeamMember:', error);
      // No error thrown - runs silently in background
    }
  }

  private async updateTeamMemberLoginStatus(userId: string) {
    try {
      await this.prisma.teamMember.updateMany({
        where: { userId },
        data: { isLoggedIn: true },
      });
    } catch (error) {
      console.error('Failed to update TeamMember login status:', error);
      // No error thrown - runs silently in background
    }
  }

  async create(dto: CreateCompanyUserDto, companyId: string, createdByUserId?: string, createdByFullName?: string) {
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

    // Verify role exists (can be from any company or default role)
    const role = await this.prisma.role.findUnique({
      where: { id: dto.roleId },
    });
    if (!role) throw new NotFoundException('Role not found');

    // Verify teamId belongs to this company
    if (dto.teamId) {
      const team = await this.prisma.team.findFirst({
        where: { id: dto.teamId, companyId },
      });
      if (!team) throw new NotFoundException('Team not found in this company');
    }

    const tempPassword = this.generateTempPassword();
    const hashedTemp = await bcrypt.hash(tempPassword, 12);
    const tempPasswordExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const user = await this.prisma.companyUser.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        fullName: `${dto.firstName} ${dto.lastName}`,
        companyId,
        roleId: dto.roleId,
        teamId: dto.teamId ?? null,
        permissionsOverride: dto.permissionsOverride ?? [],
        invitationStatus: 'pending',
        tempPassword: hashedTemp,
        tempPasswordExpiry,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        fullName: true,
        companyId: true,
        roleId: true,
        teamId: true,
        invitationStatus: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Check if CompanyUser creation was successful
    if (!user) {
      throw new Error('Failed to send invitation');
    }

    // Insert into TeamMember collection in background (no errors to main API)
    this.insertIntoTeamMember(user, createdByUserId, createdByFullName).catch(() => null);

    try {
      await this.mailService.sendTempPassword(dto.email, dto.firstName, tempPassword);
    } catch {
      throw new Error('Failed to send invitation');
    }

    return { message: 'Invitation sent successfully' };
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

  async findAll(companyId: string, teamId?: string, page = 1, limit = 50, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = { companyId, isDeleted: false };
    if (teamId) where.teamId = teamId;
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
          fullName: true,
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

    await this.prisma.companyUser.update({
      where: { id },
      data: {
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.roleId && { roleId: dto.roleId }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
    return { message: 'User updated successfully' };
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
      role: user.role?.name,
      permissions: user.role?.permissions,
    };

    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn: '30d',
    });
    const refresh_token = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    // Update TeamMember login status in background
    this.updateTeamMemberLoginStatus(user.id).catch(() => null);

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
        role: user.role?.name,
        permissions: user.role?.permissions,
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
