import { Injectable } from '@nestjs/common';

@Injectable()
export class FinosComplianceService {
  async status() {
    return {
      status: 'hooks_ready',
      notes: 'Compliance reporting hooks available',
      timestamp: new Date().toISOString(),
    };
  }
}
