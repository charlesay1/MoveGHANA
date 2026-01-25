import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { PaymentsModule } from '../payments/payments.module';
import { SettlementModule } from '../modules/settlement/settlement.module';
import { FinosModule } from '../modules/finos/finos.module';
import { OpsController } from './ops.controller';

@Module({
  imports: [DbModule, PaymentsModule, SettlementModule, FinosModule],
  controllers: [OpsController],
})
export class OpsModule {}
