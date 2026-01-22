import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RidesService } from './rides.service';
import type { RideRequestPayload } from '@movegh/types';

@Controller('rides')
export class RidesController {
  constructor(private readonly rides: RidesService) {}

  @Post('request')
  @UseGuards(JwtAuthGuard)
  requestRide(@Body() body: RideRequestPayload, @Req() req: { user: { id: string } }) {
    return this.rides.createRide(body, req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getRide(@Param('id') id: string) {
    return this.rides.getRide(id);
  }
}
