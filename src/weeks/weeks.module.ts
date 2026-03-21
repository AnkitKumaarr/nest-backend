import { Module } from '@nestjs/common';
import { WeeksService } from './weeks.service';
import { WeeksController } from './weeks.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WeeksController],
  providers: [WeeksService],
  exports: [WeeksService],
})
export class WeeksModule {}
