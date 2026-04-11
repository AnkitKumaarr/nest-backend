import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  // Ensure upload directories exist
  ['uploads/avatars', 'uploads/files'].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Increase body size limit to allow larger payloads (51,000 characters)
  app.useBodyParser('json', { limit: '50mb' });
  app.useBodyParser('urlencoded', { limit: '50mb', extended: true });

  // Serve uploaded files as static assets
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // 1. Enable Validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips out extra fields not in DTO
      forbidNonWhitelisted: true, // Errors out if extra fields are sent
      transform: true, // Automatically transforms types
    }),
  );

  // 2. Enable CORS for your SaaS Frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Apply the "Perfect" response structure
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(process.env.PORT || 4000);
}
bootstrap();