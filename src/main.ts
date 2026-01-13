import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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