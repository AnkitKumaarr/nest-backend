import { Module } from '@nestjs/common';
import { CompanyUsersService } from './company-users.service';
import { CompanyUsersController } from './company-users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({ secret: process.env.JWT_SECRET }),
    MailModule,
  ],
  controllers: [CompanyUsersController],
  providers: [CompanyUsersService],
  exports: [CompanyUsersService],
})
export class CompanyUsersModule {}
