import {
  ConflictException,
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { SignupDto } from './dto/signup.dto';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { GoogleService } from './google.service';
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service'; // Added

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private jwtService: JwtService,
    private googleService: GoogleService,
    private activityLogs: ActivityLogsService, // Injected
  ) {}

  async signIn(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    // 1. LOG: Successful Login
    await this.activityLogs.log(user.id, 'USER_LOGIN', 'Auth', user.id, 'User logged in with email');

    return this.generateTokens(user.id, user.email);
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExp = new Date(Date.now() + 3600000); 

    await this.prisma.user.update({
      where: { email },
      data: { resetToken, resetTokenExp },
    });

    // 2. LOG: Password Reset Request
    await this.activityLogs.log(user.id, 'PASSWORD_RESET_REQUEST', 'Auth', user.id);

    await this.mailService.sendPasswordReset(email, resetToken);
    return { message: 'Password reset link sent to your email' };
  }

  async resetPassword(token: string, newPass: string) {
    const user = await this.prisma.user.findUnique({
      where: { resetToken: token },
    });

    if (!user || !user.resetTokenExp || user.resetTokenExp < new Date()) {
      throw new BadRequestException('Token invalid or expired');
    }

    const hashedPassword = await bcrypt.hash(newPass, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetToken: null,
        resetTokenExp: null,
      },
    });

    // 3. LOG: Successful Password Update
    await this.activityLogs.log(user.id, 'PASSWORD_CHANGED', 'Auth', user.id);

    return { message: 'Password updated successfully' };
  }

  async googleAuth(googleToken: string) {
    const googleUser = await this.googleService.getGoogleUser(googleToken);

    let user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
          avatarUrl: googleUser.avatarUrl,
          googleId: googleUser.googleId,
          isEmailVerified: true, 
          passwordHash: '',
        },
      });
      // 4. LOG: New User via Google
      await this.activityLogs.log(user.id, 'USER_SIGNUP_GOOGLE', 'Auth', user.id);
    } else {
      user = await this.prisma.user.update({
        where: { email: googleUser.email },
        data: {
          googleId: googleUser.googleId,
          avatarUrl: googleUser.avatarUrl,
        },
      });
      // 5. LOG: Google Login
      await this.activityLogs.log(user.id, 'USER_LOGIN_GOOGLE', 'Auth', user.id);
    }

    return this.generateTokens(user.id, user.email);
  }

  async signup(dto: SignupDto) {
    const userExists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (userExists) throw new ConflictException('User already registered');

    const { password, ...userFields } = dto;
    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    return await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          ...userFields,
          passwordHash: hashedPassword,
          verificationOtp: otp,
          otpExpires,
        },
      });

      try {
        await this.mailService.sendOtp(dto.email, otp);
        
        // 6. LOG: Account Created (Pending Verification)
        await this.activityLogs.log(newUser.id, 'USER_SIGNUP_INITIATED', 'Auth', newUser.id);
        
        return { message: 'OTP sent to your email' };
      } catch (error) {
        throw new InternalServerErrorException(
          'Failed to send verification email. Please try again.'
        );
      }
    });
  }

  async verifyEmail(email: string, otp: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (
      !user ||
      !user.otpExpires ||
      user.verificationOtp !== otp ||
      user.otpExpires < new Date()
    ) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.prisma.user.update({
      where: { email },
      data: { isEmailVerified: true, verificationOtp: null, otpExpires: null },
    });

    // 7. LOG: Email Verified
    await this.activityLogs.log(user.id, 'EMAIL_VERIFIED', 'Auth', user.id);

    await this.mailService.sendWelcome(email, user.firstName);
    return this.generateTokens(user.id, user.email);
  }

  private async generateTokens(userId: string, email: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const payload = { sub: userId, email, role: user.role , orgId: user.organizationId };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}