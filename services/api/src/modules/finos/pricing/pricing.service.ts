import { Injectable } from '@nestjs/common';

export type PricingQuoteInput = {
  city: string;
  distanceKm: number;
  durationMin: number;
  surgeMultiplier: number;
  promoCode?: string;
  currency: string;
};

export type PricingQuote = {
  currency: string;
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surge: number;
  promoDiscount: number;
  taxes: number;
  commission: number;
  total: number;
  breakdown: Record<string, number>;
};

@Injectable()
export class FinosPricingService {
  quote(input: PricingQuoteInput): PricingQuote {
    const baseFare = this.round(4.0);
    const perKm = this.round(1.8);
    const perMin = this.round(0.6);
    const distanceFare = this.round(input.distanceKm * perKm);
    const timeFare = this.round(input.durationMin * perMin);
    const subtotal = this.round(baseFare + distanceFare + timeFare);
    const surge = this.round(subtotal * (input.surgeMultiplier - 1));
    const promoDiscount = this.round(input.promoCode ? Math.min(5, subtotal * 0.1) : 0);
    const taxable = this.round(subtotal + surge - promoDiscount);
    const taxes = this.round(taxable * 0.05);
    const commission = this.round(taxable * 0.15);
    const total = this.round(taxable + taxes);

    return {
      currency: input.currency,
      baseFare,
      distanceFare,
      timeFare,
      surge,
      promoDiscount,
      taxes,
      commission,
      total,
      breakdown: {
        subtotal,
        taxable,
      },
    };
  }

  private round(value: number) {
    return Number(value.toFixed(2));
  }
}
