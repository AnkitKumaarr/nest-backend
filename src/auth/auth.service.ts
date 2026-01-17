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
import { OAuth2Client } from 'google-auth-library';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

    // 1. Check if user exists
    if (!user) throw new UnauthorizedException('Invalid credentials');

    // 2. Check if user has a password (handle Google users)
    if (!user.passwordHash || user.passwordHash === '') {
      throw new UnauthorizedException(
        'This account uses Google Login. Please sign in with Google.',
      );
    }
    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    // 4. Verification Check
    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    await this.activityLogs.log(
      this.prisma, // <--- Add this first!
      user.id,
      'USER_LOGIN',
      'Auth',
      user.id,
      'User logged in with email',
    );
    return this.generateTokens(user);
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { message: 'If an account exists, a reset link has been sent.' };
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExp = new Date(Date.now() + 3600000);

    await this.prisma.user.update({
      where: { email },
      data: { resetToken, resetTokenExp },
    });

    // 2. LOG: Password Reset Request
    await this.activityLogs.log(
      this.prisma,
      user.id,
      'PASSWORD_RESET_REQUEST',
      'Auth',
      user.id,
    );
    await this.mailService.sendPasswordReset(email, resetToken);
    return { message: 'Password reset link sent to your email' };
  }

  async resetPassword(token: string, newPass: string) {
    if (!newPass) {
      throw new BadRequestException('New password is required');
    }
    const user = await this.prisma.user.findFirst({
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
    await this.activityLogs.log(
      this.prisma,
      user.id,
      'PASSWORD_CHANGED',
      'Auth',
      user.id,
    );
    return { message: 'Password updated successfully' };
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
        await this.activityLogs.log(
          tx,
          newUser.id,
          'USER_SIGNUP_INITIATED',
          'Auth',
          newUser.id,
        );

        return { message: 'OTP sent to your email' };
      } catch (error) {
        throw new InternalServerErrorException(
          'Failed to send verification email. Please try again.',
        );
      }
    });
  }
  async resendOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');
    if (user.isEmailVerified)
      throw new BadRequestException('Email already verified');

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.user.update({
      where: { email },
      data: { verificationOtp: newOtp, otpExpires },
    });

    await this.mailService.sendOtp(email, newOtp);
    return { message: 'New OTP sent to your email' };
  }

  async verifyEmail(email: string, otp: string) {
    if (!email || !otp) {
      throw new BadRequestException('Email and OTP are required');
    }
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
    await this.activityLogs.log(
      this.prisma,
      user.id,
      'EMAIL_VERIFIED',
      'Auth',
      user.id,
    );

    await this.mailService.sendWelcome(email, user.firstName);
    return this.generateTokens(user);
  }

  async googleAuth(dto: { idToken: string }) {
    try {
      const ticket = await client.verifyIdToken({
        idToken: dto.idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new UnauthorizedException('Invalid Google token payload');
      }

      const email = payload.email; // Ensure this is a string

      const user = await this.prisma.user.upsert({
        where: { email: email },
        update: {
          avatarUrl: payload.picture || null,
          firstName: payload.given_name || 'User',
          lastName: payload.family_name || '',
          isEmailVerified: true,
        },
        create: {
          email: email,
          firstName: payload.given_name || 'User',
          lastName: payload.family_name || '',
          avatarUrl: payload.picture || '',
          isEmailVerified: true,
          passwordHash: '',
        },
      });
      await this.mailService.sendWelcome(email, user.firstName);
      return this.generateTokens(user);
    } catch (error) {
      console.error('Prisma/Google Error:', error);
      throw new UnauthorizedException('Google authentication failed');
    }
  }
  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      orgId: user.organizationId,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
        orgId: user.organizationId,
      },
    };
  }
}
