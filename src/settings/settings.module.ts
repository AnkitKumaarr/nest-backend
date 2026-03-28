import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService, JwtService],
})
export class SettingsModule {}
