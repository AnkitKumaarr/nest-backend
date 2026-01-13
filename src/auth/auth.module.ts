import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleService } from './google.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' }, // SaaS standard: 1 day expiry
    }),
  ],
  providers: [
    AuthService, 
    GoogleService, 
    MailService, 
    PrismaService
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}