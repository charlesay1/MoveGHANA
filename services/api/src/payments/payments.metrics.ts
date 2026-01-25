import { Counter, Gauge, Histogram } from 'prom-client';

export const paymentsMetrics = {
  intentTotal: new Counter({
    name: 'payments_intents_total',
    help: 'Total payment intents by provider and status',
    labelNames: ['provider', 'status'] as const,
  }),
  paymentAttemptTotal: new Counter({
    name: 'payment_attempt_total',
    help: 'Payment attempts by provider and status',
    labelNames: ['provider', 'status'] as const,
  }),
  payoutTotal: new Counter({
    name: 'payments_payouts_total',
    help: 'Total payouts by provider and status',
    labelNames: ['provider', 'status'] as const,
  }),
  payoutTotalPublic: new Counter({
    name: 'payout_total',
    help: 'Payouts by provider and status',
    labelNames: ['provider', 'status'] as const,
  }),
  providerLatency: new Histogram({
    name: 'payments_provider_latency_seconds',
    help: 'Provider request latency',
    labelNames: ['provider', 'action'] as const,
    buckets: [0.1, 0.25, 0.5, 1, 2, 5, 10],
  }),
  webhookDelay: new Histogram({
    name: 'payments_webhook_delay_seconds',
    help: 'Delay between provider event and webhook ingestion',
    labelNames: ['provider'] as const,
    buckets: [1, 5, 10, 30, 60, 120, 300],
  }),
  payoutDelay: new Histogram({
    name: 'payments_payout_delay_seconds',
    help: 'Delay between payout request and provider response',
    labelNames: ['provider', 'status'] as const,
    buckets: [0.1, 0.5, 1, 2, 5, 10],
  }),
  ledgerDrift: new Gauge({
    name: 'payments_ledger_drift',
    help: 'Ledger drift detected by reconciliation',
  }),
  settlementDriftAmount: new Gauge({
    name: 'settlement_drift_amount',
    help: 'Settlement drift amount in currency units',
  }),
  ledgerInvariantFailTotal: new Counter({
    name: 'ledger_invariant_fail_total',
    help: 'Ledger invariant failures',
  }),
  escrowHoldTotal: new Counter({
    name: 'escrow_hold_total',
    help: 'Escrow holds by state',
    labelNames: ['state'] as const,
  }),
  reconciliationLag: new Gauge({
    name: 'payments_reconciliation_lag_seconds',
    help: 'Time since last reconciliation',
  }),
};
