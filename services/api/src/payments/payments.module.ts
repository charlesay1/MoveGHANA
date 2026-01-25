import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { LedgerService } from './ledger/ledger.service';
import { CommissionService } from './commission/commission.service';
import { PayoutsService } from './payouts/payouts.service';
import { WebhooksController } from './webhooks/webhooks.controller';
import { MockProvider } from '../modules/payments/providers/mock.provider';
import { MtnMomoProvider } from '../modules/payments/providers/mtn.momo.provider';
import { VodafoneCashProvider } from '../modules/payments/providers/vodafone.cash.provider';
import { AirtelTigoMoneyProvider } from '../modules/payments/providers/airteltigo.money.provider';
import { FraudService } from './fraud/fraud.service';
import { GovernanceService } from './governance/governance.service';

@Module({
  imports: [DbModule],
  controllers: [PaymentsController, WebhooksController],
  providers: [
    PaymentsService,
    LedgerService,
    CommissionService,
    PayoutsService,
    FraudService,
    GovernanceService,
    MockProvider,
    MtnMomoProvider,
    VodafoneCashProvider,
    AirtelTigoMoneyProvider,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
