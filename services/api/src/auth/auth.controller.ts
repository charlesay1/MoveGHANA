import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('start')
  @Throttle(5, 60)
  start(@Body() body: { phone: string }) {
    return this.authService.start(body.phone);
  }

  @Post('verify')
  @Throttle(5, 60)
  verify(@Body() body: { requestId: string; code: string }) {
    return this.authService.verify(body.requestId, body.code);
  }
}
