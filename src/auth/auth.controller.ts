import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { CustomAuthGuard } from './guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('verify-email')
  async verify(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyEmail(body.email, body.otp);
  }

  @Post('signin')
  async signin(@Body() body: { email: string; pass: string }) {
    return this.authService.signIn(body.email, body.pass);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPass: string }) {
    return this.authService.resetPassword(body.token, body.newPass);
  }
  @Post('resend-otp')
  async resendOtp(@Body() body: { email: string }) {
    return this.authService.resendOtp(body.email);
  }
  @Post('google')
  async googleLogin(@Body() body: { idToken: string }) {
    return this.authService.googleAuth(body);
  }

  // Example of a Protected Route
  @UseGuards(CustomAuthGuard)
  @Get('me')
  getProfile(@Request() req) {
    return req.user; // Set by CustomAuthGuard
  }
}
