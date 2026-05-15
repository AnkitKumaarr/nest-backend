import { Throttle, SkipThrottle } from '@nestjs/throttler';

// ── Layer 1: Auth endpoints — IP-based, unauthenticated ──────────────────────

/** 5 req / 60 s / IP — POST /auth/signin, /auth/google */
export const LoginThrottle = () => Throttle({ login: { limit: 5, ttl: 60000 } });

/** 3 req / 10 min / IP — POST /auth/signup */
export const RegisterThrottle = () => Throttle({ register: { limit: 3, ttl: 600000 } });

/** 3 req / 5 min / IP — POST /auth/verify-email, /auth/resend-otp */
export const OtpThrottle = () => Throttle({ otp: { limit: 3, ttl: 300000 } });

/** 3 req / 15 min / IP — POST /auth/forgot-password */
export const ForgotPasswordThrottle = () =>
  Throttle({ forgotPassword: { limit: 3, ttl: 900000 } });

/** 5 req / 60 s / IP — POST /auth/reset-password */
export const ResetPasswordThrottle = () =>
  Throttle({ resetPassword: { limit: 5, ttl: 60000 } });

// ── Layer 2: Authenticated mutations — user-based ────────────────────────────

/** 60 req / 60 s / user — POST, PATCH, DELETE on all data endpoints */
export const WriteThrottle = () => Throttle({ write: { limit: 60, ttl: 60000 } });

// ── Layer 3: Authenticated reads — user-based ────────────────────────────────

/** 300 req / 60 s / user — GET on all data endpoints */
export const ReadThrottle = () => Throttle({ read: { limit: 300, ttl: 60000 } });

// ── Layer 4: Expensive endpoints ─────────────────────────────────────────────

/** 10 req / 60 s / user — file uploads (POST /file-manager, POST /users/avatar) */
export const UploadThrottle = () => Throttle({ upload: { limit: 10, ttl: 60000 } });

/** 30 req / 60 s / user — analytics, dashboards, aggregation queries */
export const AnalyticsThrottle = () => Throttle({ analytics: { limit: 30, ttl: 60000 } });

/** 5 req / 60 s / user — invoice downloads, report exports */
export const ExportThrottle = () => Throttle({ export: { limit: 5, ttl: 60000 } });

// ── Escape hatch ─────────────────────────────────────────────────────────────

/** Remove all throttling for this route (global default still applies unless overridden) */
export { SkipThrottle };
