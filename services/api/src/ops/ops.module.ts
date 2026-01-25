import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { PaymentsModule } from '../payments/payments.module';
import { SettlementModule } from '../modules/settlement/settlement.module';
import { OpsController } from './ops.controller';

@Module({
  imports: [DbModule, PaymentsModule, SettlementModule],
  controllers: [OpsController],
})
export class OpsModule {}
