import { Injectable } from '@nestjs/common';
import { PaymentsService } from '../../../payments/payments.service';

@Injectable()
export class FinosPayoutsService {
  constructor(private readonly payments: PaymentsService) {}

  async requestPayout(params: { driverId: string; amount: number; provider: 'mock' | 'mtn' | 'vodafone' | 'airteltigo'; destination: string; idempotencyKey: string; requestId?: string }) {
    return this.payments.requestPayout(
      params.driverId,
      params.amount,
      params.provider,
      params.destination,
      params.idempotencyKey,
      { requestId: params.requestId }
    );
  }
}
