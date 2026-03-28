import { Module } from '@nestjs/common';
import { MeetingVisualsService } from './meeting-visuals.service';
import { MeetingVisualsController } from './meeting-visuals.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [MeetingVisualsController],
  providers: [MeetingVisualsService, PrismaService, JwtService],
  exports: [MeetingVisualsService],
})
export class MeetingVisualsModule {}
