import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
      },
    });
  }

  private async sendViaNodemailer(to: string, subject: string, html: string) {
    try {
      const mailOptions = {
        from: `"${process.env.APP_NAME || 'Prody'}" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      return info;
    } catch (error) {
      console.error('Mail Service Error:', error);
      throw error;
    }
  }

  async sendOtp(email: string, otp: string) {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Code</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f7f6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: rgba(255, 255, 255, 0.1);
            padding: 30px;
            text-align: center;
            color: white;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            background: white;
            padding: 40px;
            text-align: center;
          }
          .otp-container {
            background: #f8f9fa;
            border: 2px dashed #6c63ff;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
            display: inline-block;
          }
          .otp-code {
            font-size: 36px;
            font-weight: bold;
            color: #6c63ff;
            letter-spacing: 8px;
            margin: 0;
            font-family: 'Courier New', monospace;
          }
          .expiry {
            color: #6c757d;
            font-size: 14px;
            margin-top: 15px;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 12px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🔐 ${process.env.APP_NAME || 'Prody'}</div>
            <h1>Email Verification</h1>
          </div>
          <div class="content">
            <h2>Your Verification Code</h2>
            <p>Please use the following code to verify your email address:</p>
            <div class="otp-container">
              <p class="otp-code">${otp}</p>
              <p class="expiry">⏰ This code expires in 10 minutes</p>
            </div>
            <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>
          <div class="footer">
            <p>© 2024 ${process.env.APP_NAME || 'Prody'}. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    await this.sendViaNodemailer(email, '🔐 Your Verification Code', html);
  }

  async sendWelcome(email: string, name: string) {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${process.env.APP_NAME || 'Prody'}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f7f6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: rgba(255, 255, 255, 0.1);
            padding: 30px;
            text-align: center;
            color: white;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            background: white;
            padding: 40px;
            text-align: center;
          }
          .welcome-icon {
            font-size: 64px;
            margin-bottom: 20px;
          }
          .welcome-message {
            font-size: 24px;
            font-weight: 600;
            color: #333;
            margin-bottom: 20px;
          }
          .user-name {
            color: #6c63ff;
            font-weight: bold;
          }
          .checkmark {
            color: #28a745;
            font-size: 20px;
            margin-right: 8px;
          }
          .feature-list {
            text-align: left;
            max-width: 400px;
            margin: 30px auto;
          }
          .feature-item {
            padding: 10px 0;
            border-bottom: 1px solid #f0f0f0;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: 600;
            margin: 20px 0;
            transition: transform 0.3s ease;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 12px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎉 ${process.env.APP_NAME || 'Prody'}</div>
            <h1>Welcome Aboard!</h1>
          </div>
          <div class="content">
            <div class="welcome-icon">🎊</div>
            <div class="welcome-message">
              Hi <span class="user-name">${name}</span>!
            </div>
            <p style="font-size: 18px; color: #6c757d; margin-bottom: 30px;">
              Welcome to ${process.env.APP_NAME || 'Prody'}! Your email has been successfully verified.
            </p>
            <div class="feature-list">
              <div class="feature-item">
                <span class="checkmark">✓</span> Email verification completed
              </div>
              <div class="feature-item">
                <span class="checkmark">✓</span> Account is now active
              </div>
              <div class="feature-item">
                <span class="checkmark">✓</span> Ready to explore features
              </div>
            </div>
            <a href="${process.env.FRONTEND_URL || '#'}" class="cta-button">
              Get Started →
            </a>
          </div>
          <div class="footer">
            <p>© 2024 ${process.env.APP_NAME || 'Prody'}. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    await this.sendViaNodemailer(email, `🎉 Welcome to ${process.env.APP_NAME || 'Prody'}!`, html);
  }

  async sendPasswordReset(email: string, token: string) {
    const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f7f6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: rgba(255, 255, 255, 0.1);
            padding: 30px;
            text-align: center;
            color: white;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            background: white;
            padding: 40px;
            text-align: center;
          }
          .reset-icon {
            font-size: 64px;
            margin-bottom: 20px;
          }
          .warning-message {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            text-align: left;
            border-radius: 4px;
          }
          .reset-button {
            display: inline-block;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: 600;
            margin: 20px 0;
            transition: transform 0.3s ease;
            font-size: 16px;
          }
          .reset-button:hover {
            transform: translateY(-2px);
          }
          .expiry-info {
            color: #6c757d;
            font-size: 14px;
            margin-top: 20px;
          }
          .security-note {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
          }
          .security-note h3 {
            margin-top: 0;
            color: #495057;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 12px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🔒 ${process.env.APP_NAME || 'Prody'}</div>
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <div class="reset-icon">🔐</div>
            <h2>Reset Your Password</h2>
            <p style="font-size: 16px; color: #6c757d; margin-bottom: 30px;">
              We received a request to reset your password. Click the button below to create a new password.
            </p>
            
            <div class="warning-message">
              <strong>⚠️ Security Notice:</strong> This link will expire in 15 minutes for your security.
            </div>
            
            <a href="${url}" class="reset-button">
              Reset Password →
            </a>
            
            <p class="expiry-info">
              ⏰ Link expires in 15 minutes
            </p>
            
            <div class="security-note">
              <h3>🛡️ Security Tips:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Choose a strong, unique password</li>
                <li>Don't share this link with anyone</li>
                <li>If you didn't request this, ignore this email</li>
              </ul>
            </div>
            
            <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <small style="word-break: break-all;">${url}</small>
            </p>
          </div>
          <div class="footer">
            <p>© 2024 ${process.env.APP_NAME || 'Prody'}. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    await this.sendViaNodemailer(email, '🔒 Reset Your Password', html);
  }
}