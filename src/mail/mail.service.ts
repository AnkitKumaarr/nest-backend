import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  private RESEND_API_KEY = process.env.RESEND_API_KEY;
  private API_URL = 'https://api.resend.com/emails';

  private async sendViaApi(to: string, subject: string, html: string) {
    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Prody <onboarding@resend.dev>', // Use their test domain or verify your own for free
          to,
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Resend Error:', error);
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Mail Service Error:', error);
      throw error;
    }
  }

  async sendOtp(email: string, otp: string) {
    const html = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Verification Code</h2>
        <p>Your OTP is: <strong style="font-size: 24px;">${otp}</strong></p>
        <p>It expires in 10 minutes.</p>
      </div>
    `;
    await this.sendViaApi(email, 'Verification Code', html);
  }

  async sendWelcome(email: string, name: string) {
    const html = `<p>Hi ${name}, welcome to Prody! Your email is verified.</p>`;
    await this.sendViaApi(email, 'Welcome to Prody!', html);
  }

  async sendPasswordReset(email: string, token: string) {
    const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const html = `<p>Click <a href="${url}">here</a> to reset your password.</p>`;
    await this.sendViaApi(email, 'Reset Your Password', html);
  }
}