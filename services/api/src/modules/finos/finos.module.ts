import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { PaymentsModule } from '../../payments/payments.module';
import { SettlementModule } from '../settlement/settlement.module';
import { FinosController } from './finos.controller';
import { FinosLedgerService } from './ledger/ledger.service';
import { FinosWalletsService } from './wallets/wallets.service';
import { FinosPricingService } from './pricing/pricing.service';
import { FinosEscrowService } from './escrow/escrow.service';
import { FinosPayoutsService } from './payouts/payouts.service';
import { FinosSettlementService } from './settlement/settlement.service';
import { FinosTreasuryService } from './treasury/treasury.service';
import { FinosRiskService } from './risk/risk.service';
import { FinosComplianceService } from './compliance/compliance.service';
import { FinosReportingService } from './reporting/reporting.service';

@Module({
  imports: [DbModule, PaymentsModule, SettlementModule],
  controllers: [FinosController],
  providers: [
    FinosLedgerService,
    FinosWalletsService,
    FinosPricingService,
    FinosEscrowService,
    FinosPayoutsService,
    FinosSettlementService,
    FinosTreasuryService,
    FinosRiskService,
    FinosComplianceService,
    FinosReportingService,
  ],
  exports: [
    FinosLedgerService,
    FinosWalletsService,
    FinosPricingService,
    FinosEscrowService,
    FinosPayoutsService,
    FinosSettlementService,
    FinosTreasuryService,
    FinosRiskService,
    FinosComplianceService,
    FinosReportingService,
  ],
})
export class FinosModule {}
