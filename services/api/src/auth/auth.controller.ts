import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('start')
  start(@Body() body: { phone: string }) {
    return this.authService.start(body.phone);
  }

  @Post('verify')
  verify(@Body() body: { requestId: string; code: string }) {
    return this.authService.verify(body.requestId, body.code);
  }
}
