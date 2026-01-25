import { request } from './apiClient';

export type PaymentProvider = 'mock' | 'mtn' | 'vodafone' | 'airteltigo';

export type CreatePaymentIntentRequest = {
  tripId: string;
  riderId: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  phoneNumber: string;
};

export type CreatePaymentIntentResponse = {
  intentId: string;
  status: string;
  checkoutInstructions: string;
};

export type ConfirmPaymentIntentRequest = {
  phoneNumber: string;
  driverId?: string;
};

export const createIdempotencyKey = () => `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export const createPaymentIntent = (body: CreatePaymentIntentRequest, idempotencyKey: string) =>
  request<CreatePaymentIntentResponse>('/v1/payments/intents', {
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(body),
  });

export const confirmPaymentIntent = (intentId: string, body: ConfirmPaymentIntentRequest, idempotencyKey: string) =>
  request<{ intentId: string; status: string }>(`/v1/payments/intents/${intentId}/confirm`, {
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(body),
  });
