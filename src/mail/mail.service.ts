import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 587,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  async sendOtp(email: string, otp: string) {
    await this.transporter.sendMail({
      from: '"SaaS Support" <no-reply@saas.com>',
      to: email,
      subject: 'Verification Code',
      text: `Your OTP is ${otp}. It expires in 10 minutes.`,
    });
  }

  async sendWelcome(email: string, name: string) {
    await this.transporter.sendMail({
      from: '"SaaS Team" <hello@saas.com>',
      to: email,
      subject: 'Welcome!',
      text: `Hi ${name}, your email is verified. Welcome to our product!`,
    });
  }
  async sendPasswordReset(email: string, token: string) {
    const url = `http://localhost:3000/reset-password?token=${token}`; // Update to your frontend URL
    await this.transporter.sendMail({
      from: '"Security" <security@saas.com>',
      to: email,
      subject: 'Reset Password',
      html: `<p>Click <a href="${url}">here</a> to reset your password.</p>`,
    });
  }
}
