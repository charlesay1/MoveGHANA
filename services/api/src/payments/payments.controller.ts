import { BadRequestException, Body, Controller, Get, Headers, Param, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PaymentsService } from './payments.service';
import type { MomoProviderName } from './providers/momo.provider.interface';

const createIntentSchema = z.object({
  tripId: z.string().min(1),
  riderId: z.string().min(1).optional(),
  amount: z.coerce.number().positive(),
  currency: z.string().min(1).default('GHS'),
  provider: z.enum(['mock', 'mtn', 'vodafone', 'airteltigo']),
  phoneNumber: z.string().min(8),
});

const confirmIntentSchema = z.object({
  phoneNumber: z.string().min(8),
  driverId: z.string().min(1).optional(),
});

const payoutSchema = z.object({
  amount: z.coerce.number().positive(),
  provider: z.string().min(1),
  destinationPhone: z.string().min(8),
});

@Controller('v1')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('payments/intents')
  @UseGuards(JwtAuthGuard)
  async createIntent(@Body() body: unknown, @Headers('idempotency-key') idempotencyKey: string | undefined, @Req() req: Request & { user?: { id: string; role?: string } }) {
    if (!idempotencyKey) throw new BadRequestException('Idempotency-Key is required.');
    const parsed = createIntentSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((issue) => issue.message).join('; '));
    }
    const payload = parsed.data;
    if (req.user?.role && req.user.role !== 'rider') throw new BadRequestException('Rider role required.');
    const riderId = payload.riderId || req.user?.id;
    if (!riderId) throw new BadRequestException('riderId is required.');
    if (payload.riderId && req.user?.id && payload.riderId !== req.user.id) {
      throw new BadRequestException('riderId mismatch.');
    }

    return this.payments.createPaymentIntent(
      {
        tripId: payload.tripId,
        riderId,
        amount: payload.amount,
        currency: payload.currency,
        provider: payload.provider as MomoProviderName,
        phoneNumber: payload.phoneNumber,
      },
      idempotencyKey,
      {
        requestId: req.requestId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      }
    );
  }

  @Post('payments/intents/:id/confirm')
  @UseGuards(JwtAuthGuard)
  async confirmIntent(
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Req() req: Request & { user?: { role?: string } }
  ) {
    if (!idempotencyKey) throw new BadRequestException('Idempotency-Key is required.');
    const parsed = confirmIntentSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((issue) => issue.message).join('; '));
    }
    if (req.user?.role && req.user.role !== 'rider') throw new BadRequestException('Rider role required.');
    const payload = parsed.data;
    return this.payments.confirmPaymentIntent(
      id,
      {
        phoneNumber: payload.phoneNumber,
        driverId: payload.driverId,
      },
      idempotencyKey,
      {
        requestId: req.requestId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      }
    );
  }

  @Get('wallets/me')
  @UseGuards(JwtAuthGuard)
  async getWallet(@Req() req: Request & { user?: { id: string; role?: string } }) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('Unauthorized');
    const ownerType = req.user?.role === 'driver' ? 'driver' : 'rider';
    return this.payments.getWalletBalances(ownerType, userId, 'GHS');
  }

  @Post('payouts')
  @UseGuards(JwtAuthGuard)
  async requestPayout(
    @Body() body: unknown,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Req() req: Request & { user?: { id: string; role?: string } }
  ) {
    if (!idempotencyKey) throw new BadRequestException('Idempotency-Key is required.');
    const parsed = payoutSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((issue) => issue.message).join('; '));
    }
    const payload = parsed.data;
    const driverId = req.user?.id;
    if (!driverId) throw new UnauthorizedException('Unauthorized');
    if (req.user?.role !== 'driver') throw new BadRequestException('Driver role required.');

    return this.payments.requestPayout(
      driverId,
      payload.amount,
      payload.provider,
      payload.destinationPhone,
      idempotencyKey,
      {
        requestId: req.requestId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      }
    );
  }
}
