import { Module } from '@nestjs/common';
import { LeaderService } from './leader.service';
import { LeaderController } from './leader.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LeaderController],
  providers: [LeaderService],
})
export class LeaderModule {}
