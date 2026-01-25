import { Counter, Gauge, Histogram } from 'prom-client';

export const paymentsMetrics = {
  intentTotal: new Counter({
    name: 'payments_intents_total',
    help: 'Total payment intents by provider and status',
    labelNames: ['provider', 'status'] as const,
  }),
  payoutTotal: new Counter({
    name: 'payments_payouts_total',
    help: 'Total payouts by provider and status',
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
  reconciliationLag: new Gauge({
    name: 'payments_reconciliation_lag_seconds',
    help: 'Time since last reconciliation',
  }),
};
