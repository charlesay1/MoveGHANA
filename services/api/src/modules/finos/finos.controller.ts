import { Body, Controller, Post } from '@nestjs/common';
import { z } from 'zod';
import { FinosPricingService } from './pricing/pricing.service';

const pricingSchema = z.object({
  city: z.string().min(1).default('accra'),
  distanceKm: z.coerce.number().positive(),
  durationMin: z.coerce.number().positive(),
  surgeMultiplier: z.coerce.number().min(1).default(1),
  promoCode: z.string().optional(),
  currency: z.string().min(1).default('GHS'),
});

@Controller('v1/finos')
export class FinosController {
  constructor(private readonly pricing: FinosPricingService) {}

  @Post('pricing/quote')
  async quote(@Body() body: unknown) {
    const parsed = pricingSchema.parse(body);
    return this.pricing.quote(parsed);
  }
}
