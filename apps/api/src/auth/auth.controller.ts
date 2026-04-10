import { Controller, Post, Body, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request } from 'express';

declare module 'express' {
  interface Request {
    session: {
      user?: any;
      [key: string]: any;
    };
  }
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }, @Req() req: Request) {
    const user = await this.authService.validateUser(body.email, body.password);
    req.session.user = user;
    return { user };
  }

  @Post('register')
  async register(@Body() body: { email: string; password: string }) {
    return this.authService.register(body.email, body.password);
  }
}
