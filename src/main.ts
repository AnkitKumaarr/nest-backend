import 'dotenv/config';
import * as net from 'net';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => { server.close(); resolve(true); });
    server.listen(port);
  });
}

async function findAvailablePort(startPort: number): Promise<number> {
  let port = startPort;
  while (!(await isPortAvailable(port))) {
    port++;
  }
  return port;
}

async function bootstrap() {
  ['uploads/avatars', 'uploads/files'].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ── Security headers via Helmet ──────────────────────────────────────────
  app.use(
    helmet({
      // Allow same-origin framing only
      frameguard: { action: 'sameorigin' },
      // Strict HTTPS (1 year, include subdomains)
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
      // Block MIME-type sniffing
      noSniff: true,
      // Prevent XSS via the legacy X-XSS-Protection header
      xssFilter: true,
      // Hide server fingerprint
      hidePoweredBy: true,
      // Restrict cross-origin resource policy
      crossOriginResourcePolicy: { policy: 'same-site' },
      // Content-Security-Policy (tighten in prod by removing 'unsafe-inline')
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
    }),
  );

  // ── Trust proxy for correct IP behind load balancers / reverse proxies ───
  app.set('trust proxy', 1);

  // ── Body size limits ─────────────────────────────────────────────────────
  // Large limit only for file-upload routes; keep JSON tight at 1 MB
  app.useBodyParser('json', { limit: '1mb' });
  app.useBodyParser('urlencoded', { limit: '1mb', extended: true });

  // ── Static assets ────────────────────────────────────────────────────────
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // ── Global API prefix ────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── Global validation ────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ── CORS ─────────────────────────────────────────────────────────────────
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? process.env.FRONTEND_URL ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: (origin, callback) => {
      // Allow server-to-server calls (no Origin header) and whitelisted origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    credentials: true,
    maxAge: 86400, // preflight cache: 24 h
  });

  // ── Global interceptors & filters ────────────────────────────────────────
  app.useGlobalInterceptors(new TenantInterceptor(), new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const preferredPort = Number(process.env.PORT) || 4000;
  const port = await findAvailablePort(preferredPort);
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
