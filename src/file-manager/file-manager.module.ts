import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MulterModule } from '@nestjs/platform-express';
import { FileManagerService } from './file-manager.service';
import { FileManagerController } from './file-manager.controller';

@Module({
  imports: [
    MulterModule.register({ dest: './uploads/files' }),
  ],
  controllers: [FileManagerController],
  providers: [FileManagerService, JwtService],
})
export class FileManagerModule {}
