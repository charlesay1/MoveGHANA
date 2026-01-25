'use strict';

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('wallets', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    owner_type: { type: 'text', notNull: true },
    owner_id: { type: 'text', notNull: true },
    currency: { type: 'text', notNull: true, default: 'GHS' },
    status: { type: 'text', notNull: true, default: 'active' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('wallets', 'wallets_owner_type_check',
    "CHECK (owner_type IN ('rider','driver','platform'))"
  );
  pgm.addConstraint('wallets', 'wallets_status_check',
    "CHECK (status IN ('active','suspended'))"
  );
  pgm.addIndex('wallets', ['owner_type', 'owner_id', 'currency'], { unique: true });

  pgm.createTable('ledger_accounts', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    wallet_id: {
      type: 'uuid',
      notNull: true,
      references: 'wallets',
      onDelete: 'CASCADE',
    },
    type: { type: 'text', notNull: true },
    currency: { type: 'text', notNull: true, default: 'GHS' },
    balance: { type: 'numeric(14,2)', notNull: true, default: 0 },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('ledger_accounts', 'ledger_accounts_type_check',
    "CHECK (type IN ('available','pending','escrow'))"
  );
  pgm.addConstraint('ledger_accounts', 'ledger_accounts_balance_check',
    "CHECK (type = 'pending' OR balance >= 0)"
  );
  pgm.addIndex('ledger_accounts', ['wallet_id', 'type', 'currency'], { unique: true });

  pgm.createTable('transactions', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    type: { type: 'text', notNull: true },
    status: { type: 'text', notNull: true },
    idempotency_key: { type: 'text' },
    metadata: { type: 'jsonb', notNull: true, default: '{}' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('transactions', 'transactions_type_check',
    "CHECK (type IN ('payment','commission','payout','refund','adjustment'))"
  );
  pgm.addIndex('transactions', ['idempotency_key'], { unique: true });

  pgm.createTable('ledger_entries', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    account_id: {
      type: 'uuid',
      notNull: true,
      references: 'ledger_accounts',
      onDelete: 'CASCADE',
    },
    txn_id: {
      type: 'uuid',
      notNull: true,
      references: 'transactions',
      onDelete: 'CASCADE',
    },
    direction: { type: 'text', notNull: true },
    amount: { type: 'numeric(14,2)', notNull: true },
    balance_after: { type: 'numeric(14,2)', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('ledger_entries', 'ledger_entries_direction_check',
    "CHECK (direction IN ('debit','credit'))"
  );
  pgm.addIndex('ledger_entries', ['account_id']);
  pgm.addIndex('ledger_entries', ['txn_id']);

  pgm.createTable('payment_intents', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    rider_id: { type: 'text', notNull: true },
    trip_id: { type: 'text', notNull: true },
    amount: { type: 'numeric(14,2)', notNull: true },
    currency: { type: 'text', notNull: true, default: 'GHS' },
    provider: { type: 'text', notNull: true },
    provider_ref: { type: 'text' },
    status: { type: 'text', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('payment_intents', 'payment_intents_status_check',
    "CHECK (status IN ('created','authorized','captured','failed'))"
  );
  pgm.addIndex('payment_intents', ['rider_id']);
  pgm.addIndex('payment_intents', ['trip_id']);
  pgm.addIndex('payment_intents', ['provider', 'provider_ref'], { unique: true, where: 'provider_ref IS NOT NULL' });

  pgm.createTable('commission_rules', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'text', notNull: true },
    percent: { type: 'numeric(5,4)', notNull: true, default: 0 },
    fixed_fee: { type: 'numeric(14,2)', notNull: true, default: 0 },
    applies_to: { type: 'text', notNull: true },
    active: { type: 'boolean', notNull: true, default: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('commission_rules', 'commission_rules_applies_check',
    "CHECK (applies_to IN ('ride','delivery'))"
  );
  pgm.addIndex('commission_rules', ['name'], { unique: true });

  pgm.createTable('payouts', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    driver_id: { type: 'text', notNull: true },
    amount: { type: 'numeric(14,2)', notNull: true },
    currency: { type: 'text', notNull: true, default: 'GHS' },
    provider: { type: 'text', notNull: true },
    destination: { type: 'text', notNull: true },
    status: { type: 'text', notNull: true },
    provider_ref: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('payouts', 'payouts_status_check',
    "CHECK (status IN ('queued','sent','settled','failed'))"
  );
  pgm.addIndex('payouts', ['driver_id']);

  pgm.createTable('audit_logs', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    actor: { type: 'text', notNull: true },
    action: { type: 'text', notNull: true },
    target: { type: 'text', notNull: true },
    request_id: { type: 'text' },
    ip: { type: 'text' },
    user_agent: { type: 'text' },
    payload_hash: { type: 'text', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addIndex('audit_logs', ['target']);
  pgm.addIndex('audit_logs', ['created_at']);
};

exports.down = (pgm) => {
  pgm.dropTable('audit_logs');
  pgm.dropTable('payouts');
  pgm.dropTable('commission_rules');
  pgm.dropTable('payment_intents');
  pgm.dropTable('ledger_entries');
  pgm.dropTable('transactions');
  pgm.dropTable('ledger_accounts');
  pgm.dropTable('wallets');
};
