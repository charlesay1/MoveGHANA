export type MomoProviderName = 'mock' | 'mtn' | 'vodafone' | 'airteltigo';

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
};

export type ConfirmPaymentInput = {
  intentId: string;
  amount: number;
  currency: string;
  phoneNumber: string;
  riderId: string;
};

export type ConfirmPaymentResult = {
  status: 'authorized' | 'captured' | 'failed';
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
};

export interface MomoProvider {
  name: MomoProviderName;
  initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  confirmPayment(input: ConfirmPaymentInput): Promise<ConfirmPaymentResult>;
  verifyWebhook(headers: Record<string, string | string[] | undefined>, payload: unknown): boolean;
  parseWebhook(payload: unknown): WebhookEvent;
  healthCheck(): Promise<'ok' | 'degraded' | 'down'>;
}
