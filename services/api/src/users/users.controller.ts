import { Body, Controller, Get, Patch, Post, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: { user: { id: string } }) {
    const user = this.users.getMe(req.user.id);
    if (!user) throw new UnauthorizedException('User not found.');
    return user;
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  update(
    @Req() req: { user: { id: string } },
    @Body() body: { firstName: string; lastName?: string; email?: string },
  ) {
    const user = this.users.updateProfile(req.user.id, body);
    if (!user) throw new UnauthorizedException('User not found.');
    return user;
  }

  @Post('profile')
  @UseGuards(JwtAuthGuard)
  createOrUpdate(
    @Req() req: { user: { id: string } },
    @Body() body: { firstName: string; lastName?: string; email?: string },
  ) {
    const user = this.users.updateProfile(req.user.id, body);
    if (!user) throw new UnauthorizedException('User not found.');
    return user;
  }
}
