export type LedgerDirection = 'debit' | 'credit';
export type LedgerAccountType = 'available' | 'pending' | 'escrow';

export type LedgerAccountRow = {
  id: string;
  balance: number;
  type: LedgerAccountType;
};

export type LedgerEntryInput = {
  accountId: string;
  direction: LedgerDirection;
  amount: number;
  balanceAfter: number;
};

export const normalizeAmount = (amount: number) => Number(amount.toFixed(2));

export const buildTransferEntries = (from: LedgerAccountRow, to: LedgerAccountRow, amount: number) => {
  const normalized = normalizeAmount(amount);
  const fromBalance = normalizeAmount(from.balance - normalized);
  const toBalance = normalizeAmount(to.balance + normalized);
  return {
    debit: {
      accountId: from.id,
      direction: 'debit' as const,
      amount: normalized,
      balanceAfter: fromBalance,
    },
    credit: {
      accountId: to.id,
      direction: 'credit' as const,
      amount: normalized,
      balanceAfter: toBalance,
    },
  };
};
