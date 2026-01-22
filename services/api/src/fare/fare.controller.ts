import { Body, Controller, Post } from '@nestjs/common';
import type { FareEstimateRequest } from '@movegh/types';
import { FareService } from './fare.service';

@Controller('fare')
export class FareController {
  constructor(private readonly fare: FareService) {}

  @Post('estimate')
  estimate(@Body() body: FareEstimateRequest) {
    return this.fare.estimate(body);
  }
}
