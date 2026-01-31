# Mail Service Configuration

This mail service has been converted from ResendAPI to Nodemailer with modern HTML email templates.

## Environment Variables Required

Add these environment variables to your `.env` file:

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Alternative SMTP providers:
# For Outlook/Hotmail:
# SMTP_HOST=smtp-mail.outlook.com
# SMTP_PORT=587

# For Yahoo:
# SMTP_HOST=smtp.mail.yahoo.com
# SMTP_PORT=587

# App Configuration
APP_NAME=Prody
FRONTEND_URL=http://localhost:3000
```

## Gmail Setup Guide

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this app password as `SMTP_PASS`

## Features

### 🎨 Modern Email Templates
- **OTP Verification**: Beautiful gradient design with large, readable OTP code
- **Welcome Email**: Celebratory design with feature checklist
- **Password Reset**: Security-focused design with warning notices

### 📧 Email Types
1. **sendOtp(email, otp)** - Sends verification code
2. **sendWelcome(email, name)** - Sends welcome message
3. **sendPasswordReset(email, token)** - Sends password reset link

### 🛡️ Security Features
- Token expiration warnings
- Security tips in password reset emails
- Professional branding and trust indicators

## Usage

```typescript
import { MailService } from './mail/mail.service';

// In your controller or service
constructor(private mailService: MailService) {}

// Send OTP
await this.mailService.sendOtp('user@example.com', '123456');

// Send welcome email
await this.mailService.sendWelcome('user@example.com', 'John');

// Send password reset
await this.mailService.sendPasswordReset('user@example.com', 'reset-token');
```

## Module Integration

Make sure to import the MailModule in your app module:

```typescript
import { MailModule } from './mail/mail.module';

@Module({
  imports: [MailModule],
  // ...
})
export class AppModule {}
```

## Testing

To test emails during development:
1. Use a service like [ethereal.email](https://ethereal.email/) for testing
2. Set SMTP credentials to Ethereal's test values
3. Check emails in the Ethereal interface

## Troubleshooting

### Common Issues:
1. **"Invalid login"** - Use app password for Gmail, not regular password
2. **"Connection refused"** - Check SMTP host and port
3. **"Email not sending"** - Verify firewall and network settings

### Debug Mode:
Add to your constructor:
```typescript
this.transporter.verify().then(console.log).catch(console.error);
```
