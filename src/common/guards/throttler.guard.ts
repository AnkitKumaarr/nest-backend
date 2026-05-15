import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { HttpStatus, HttpException } from '@nestjs/common';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  /**
   * Tracker key strategy:
   *  - Authenticated requests  → track per user  (`uid:<userId>`)
   *  - Unauthenticated requests → track per IP   (`ip:<address>`)
   *
   * For authenticated routes the JWT is decoded (NOT verified) here; full
   * cryptographic verification still happens in CustomAuthGuard.
   * Decoding without verification is intentional — it gives us the userId
   * for bucketing without duplicating the verification logic.
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const auth = req.headers?.authorization as string | undefined;

    if (auth?.startsWith('Bearer ')) {
      try {
        const token = auth.slice(7);
        const payloadB64 = token.split('.')[1];
        if (payloadB64) {
          const payload = JSON.parse(
            Buffer.from(payloadB64, 'base64url').toString('utf8'),
          );
          if (payload?.sub) {
            return `uid:${payload.sub}`;
          }
        }
      } catch {
        // Malformed token — fall through to IP-based tracking
      }
    }

    // No valid Bearer token: use client IP (supports proxies via trust proxy)
    const forwarded = req.headers['x-forwarded-for'] as string | undefined;
    const ip = forwarded
      ? forwarded.split(',')[0].trim()
      : (req.ip ?? 'unknown');
    return `ip:${ip}`;
  }

  protected async throwThrottlingException(): Promise<void> {
    throw new HttpException(
      {
        success: false,
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Too many requests. Please slow down and try again later.',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
