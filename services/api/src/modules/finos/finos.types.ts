export type FinancialAccountOwner = 'platform' | 'rider' | 'driver' | 'merchant' | 'ops';

export type FinancialAccount = {
  id: string;
  ownerType: FinancialAccountOwner;
  ownerId: string;
  currency: string;
  status: 'active' | 'suspended';
};

export type LedgerEntry = {
  id: string;
  txId: string;
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
  currency: string;
  memo?: string;
  eventType?: string;
  idempotencyKey?: string;
};

export type PaymentIntentState = 'created' | 'pending' | 'authorized' | 'captured' | 'failed' | 'canceled';

export type EscrowHoldState = 'held' | 'released' | 'refunded' | 'disputed';

export type PayoutState = 'requested' | 'queued' | 'sent' | 'succeeded' | 'failed';

export type SettlementState = 'pending' | 'matched' | 'mismatch';

export type DisputeState = 'open' | 'resolved' | 'refunded';
