import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { LedgerService } from './ledger/ledger.service';
import { CommissionService } from './commission/commission.service';
import { PayoutsService } from './payouts/payouts.service';
import { WebhooksController } from './webhooks/webhooks.controller';
import { MockProvider } from './providers/mock.provider';
import { MtnProvider } from './providers/mtn.provider';
import { VodafoneProvider } from './providers/vodafone.provider';
import { AirtelTigoProvider } from './providers/airteltigo.provider';

@Module({
  imports: [DbModule],
  controllers: [PaymentsController, WebhooksController],
  providers: [
    PaymentsService,
    LedgerService,
    CommissionService,
    PayoutsService,
    MockProvider,
    MtnProvider,
    VodafoneProvider,
    AirtelTigoProvider,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
