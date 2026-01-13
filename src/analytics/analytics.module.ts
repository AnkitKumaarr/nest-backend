import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService, 
    PrismaService, 
    JwtService
  ],
})
export class AnalyticsModule {}