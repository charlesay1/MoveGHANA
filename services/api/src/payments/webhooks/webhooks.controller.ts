import { BadRequestException, Body, Controller, Headers, Param, Post } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentsService } from '../payments.service';
import type { MomoProviderName } from '../providers/momo.provider.interface';

@Controller('v1/payments/webhooks')
export class WebhooksController {
  constructor(private readonly payments: PaymentsService) {}

  @Post(':provider')
  async handleWebhook(
    @Param('provider') provider: MomoProviderName,
    @Body() body: unknown,
    @Headers() headers: Request['headers']
  ) {
    try {
      return await this.payments.handleWebhook(provider, body, headers as Record<string, string | string[] | undefined>);
    } catch (error) {
      if (error instanceof Error) throw new BadRequestException(error.message);
      throw new BadRequestException('Invalid webhook');
    }
  }
}
