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
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
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

  async signIn(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // 1. Check if user exists
    if (!user) throw new UnauthorizedException('Invalid credentials');

    // 2. Check if user has a password (handle Google users)
    if (!user.passwordHash || user.passwordHash === '') {
      throw new UnauthorizedException(
        'This account uses Google Login. Please sign in with Google.',
      );
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Invalid password or email');

    // 4. Verification Check
    if (!user.isEmailVerified) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Please verify your email first',
        errorMsg: 'EMAIL_VERIFICATION_FAILED',
      });
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
    try {
      await this.mailService.sendPasswordReset(email, resetToken);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      // Don't expose email service issues to user
    }
    return { message: 'Password reset link sent to your email' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    if (!newPassword) {
      throw new BadRequestException('New password is required');
    }

    const user = await this.prisma.user.findFirst({
      where: { resetToken: token },
    });

    // TODO: Uncomment token expiry check after testing
    if (!user || !user.resetTokenExp || user.resetTokenExp < new Date()) {
      throw new BadRequestException('Token invalid or expired');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

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

  /**
   * Generate fullName from firstName and lastName
   */
  private generateFullName(firstName: string, lastName?: string): string {
    return lastName ? `${firstName} ${lastName}` : firstName;
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
          email: userFields.email,
          firstName: userFields.firstName,
          lastName: userFields.lastName || '',
          fullName: this.generateFullName(
            userFields.firstName,
            userFields.lastName,
          ),
          passwordHash: hashedPassword,
          verificationOtp: otp,
          otpExpires,
        },
      });

      try {
        await this.mailService.sendOtp(dto.email, otp);
        console.log('OTP sent to your email', otp);

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
        console.error('Failed to send OTP email:', error);
        // Don't throw error to avoid exposing email service issues
        // User can still request OTP resend
        return {
          message: 'Account created. Please request OTP if not received.',
        };
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

    try {
      await this.mailService.sendOtp(email, newOtp);
    } catch (error) {
      console.error('Failed to resend OTP:', error);
      throw new InternalServerErrorException(
        'Failed to send OTP. Please try again later.',
      );
    }
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

    try {
      await this.mailService.sendWelcome(
        email,
        user.fullName || user.firstName,
      );
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't block login due to welcome email failure
    }
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
          lastName: payload.family_name || null,
          fullName: this.generateFullName(
            payload.given_name || 'User',
            payload.family_name,
          ),
          isEmailVerified: true,
        },
        create: {
          email: email,
          firstName: payload.given_name || 'User',
          lastName: payload.family_name || null,
          fullName: this.generateFullName(
            payload.given_name || 'User',
            payload.family_name,
          ),
          avatarUrl: payload.picture || '',
          isEmailVerified: true,
          passwordHash: '',
        },
      });
      try {
        await this.mailService.sendWelcome(
          email,
          user.fullName || user.firstName,
        );
      } catch (error) {
        console.error('Failed to send welcome email after Google auth:', error);
        // Don't block Google auth due to welcome email failure
      }
      return this.generateTokens(user);
    } catch (error) {
      console.error('Prisma/Google Error:', error);
      throw new UnauthorizedException('Google authentication failed');
    }
  }
  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        companyId: true,
        isEmailVerified: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      // Verify the refresh token
      const payload = await this.jwtService.verifyAsync(
        refreshTokenDto.refresh_token,
      );

      // Get user from database to ensure they still exist and are active
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
          role: true,
          companyId: true,
          isEmailVerified: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!user.isEmailVerified) {
        throw new UnauthorizedException('Email not verified');
      }

      let shouldRefresh = true;

      // Check if current access token is expiring within 5 minutes
      if (refreshTokenDto.current_access_token) {
        try {
          const currentPayload = this.jwtService.decode(
            refreshTokenDto.current_access_token,
          ) as any;
          if (currentPayload && currentPayload.exp) {
            const currentTime = Math.floor(Date.now() / 1000);
            const timeUntilExpiry = currentPayload.exp - currentTime;
            const fiveMinutesInSeconds = 5 * 60;

            // Only refresh if token is expiring within 5 minutes or already expired
            shouldRefresh = timeUntilExpiry <= fiveMinutesInSeconds;
          }
        } catch (decodeError) {
          // If we can't decode the current token, assume we should refresh
          shouldRefresh = true;
        }
      }

      if (shouldRefresh) {
        // Log the token refresh activity
        await this.activityLogs.log(
          this.prisma,
          user.id,
          'TOKEN_REFRESHED',
          'Auth',
          user.id,
          'Access token refreshed using refresh token',
        );

        // Generate new tokens
        return this.generateTokens(user);
      } else {
        // Token is still valid for more than 5 minutes
        return {
          message: 'Token is still valid, no refresh needed',
          expires_in: 1800, // 30 minutes in seconds
        };
      }
    } catch (error) {
      if (
        error.name === 'JsonWebTokenError' ||
        error.name === 'TokenExpiredError'
      ) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }
      throw error;
    }
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      orgId: user.companyId,
    };

    // Generate access token with 30 minutes expiry
    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn: '30d',
    });

    // Generate refresh token with longer expiry (7 days)
    const refresh_token = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    return {
      access_token,
      refresh_token,
      expires_in: 2592000, // 30 days in seconds
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
        orgId: user.companyId,
      },
    };
  }
}
