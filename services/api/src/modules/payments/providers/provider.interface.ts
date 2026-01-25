export type ProviderName = 'mock' | 'mtn' | 'vodafone' | 'airteltigo';
export type ProviderMode = 'mock' | 'live';

export type ProviderConfig = {
  name: ProviderName;
  mode: ProviderMode;
  baseUrl: string;
  apiKey: string;
  apiSecret: string;
  merchantId?: string;
  webhookSecret: string;
  endpoints: {
    initiate: string;
    verify: string;
    refund: string;
    payout: string;
  };
};

export type ProviderContext = {
  idempotencyKey: string;
  correlationId: string;
  requestId?: string;
};

export type InitiatePaymentInput = {
  intentId: string;
  amount: number;
  currency: string;
  phoneNumber: string;
  riderId: string;
  tripId: string;
};

export type InitiatePaymentResult = {
  providerRef: string;
  checkoutInstructions: string;
  status: 'created' | 'authorized' | 'captured' | 'failed';
};

export type VerifyPaymentInput = {
  intentId: string;
  providerRef?: string;
  amount: number;
  currency: string;
  phoneNumber: string;
  riderId: string;
};

export type VerifyPaymentResult = {
  status: 'authorized' | 'captured' | 'failed';
  providerRef?: string;
};

export type RefundInput = {
  intentId: string;
  providerRef: string;
  amount: number;
  currency: string;
  reason?: string;
};

export type RefundResult = {
  status: 'queued' | 'settled' | 'failed';
  providerRef?: string;
};

export type PayoutInput = {
  payoutId: string;
  driverId: string;
  amount: number;
  currency: string;
  destination: string;
};

export type PayoutResult = {
  status: 'queued' | 'sent' | 'settled' | 'failed';
  providerRef?: string;
};

export type WebhookEvent = {
  eventId: string;
  intentId: string;
  status: 'authorized' | 'captured' | 'failed';
  providerRef?: string;
  amount?: number;
  currency?: string;
  riderId?: string;
  driverId?: string;
  timestamp?: string;
};

export interface PaymentProvider {
  name: ProviderName;
  initiatePayment(input: InitiatePaymentInput, ctx: ProviderContext): Promise<InitiatePaymentResult>;
  verifyPayment(input: VerifyPaymentInput, ctx: ProviderContext): Promise<VerifyPaymentResult>;
  refund(input: RefundInput, ctx: ProviderContext): Promise<RefundResult>;
  payout(input: PayoutInput, ctx: ProviderContext): Promise<PayoutResult>;
  webhookHandler(headers: Record<string, string | string[] | undefined>, payload: unknown): WebhookEvent;
  healthCheck(): Promise<'ok' | 'degraded' | 'down'>;
}
