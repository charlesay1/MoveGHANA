import { Injectable } from '@nestjs/common';
import { SettlementService } from '../../settlement/settlement.service';

@Injectable()
export class FinosSettlementService {
  constructor(private readonly settlement: SettlementService) {}

  async latest() {
    return this.settlement.getLatestSettlement();
  }
}
