import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { SettlementService } from './settlement.service';

@Module({
  imports: [DbModule],
  providers: [SettlementService],
  exports: [SettlementService],
})
export class SettlementModule {}
