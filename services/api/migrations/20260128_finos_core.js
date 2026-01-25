'use strict';

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('financial_accounts', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    owner_type: { type: 'text', notNull: true },
    owner_id: { type: 'text', notNull: true },
    currency: { type: 'text', notNull: true, default: 'GHS' },
    status: { type: 'text', notNull: true, default: 'active' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('financial_accounts', 'financial_accounts_owner_check', "CHECK (owner_type IN ('platform','rider','driver','merchant','ops'))");
  pgm.addConstraint('financial_accounts', 'financial_accounts_status_check', "CHECK (status IN ('active','suspended'))");
  pgm.addIndex('financial_accounts', ['owner_type', 'owner_id', 'currency'], { unique: true });

  pgm.addColumns('ledger_entries', {
    debit_account_id: { type: 'uuid', references: 'financial_accounts', onDelete: 'SET NULL' },
    credit_account_id: { type: 'uuid', references: 'financial_accounts', onDelete: 'SET NULL' },
    currency: { type: 'text' },
    memo: { type: 'text' },
    event_type: { type: 'text' },
    idempotency_key: { type: 'text' },
  });
  pgm.addIndex('ledger_entries', ['idempotency_key']);

  pgm.dropConstraint('payment_intents', 'payment_intents_status_check');
  pgm.addConstraint(
    'payment_intents',
    'payment_intents_status_check',
    "CHECK (status IN ('created','pending','authorized','captured','failed','canceled','review','held'))"
  );

  pgm.addColumns('payment_intents', {
    phone: { type: 'text' },
    fees: { type: 'numeric(14,2)', notNull: true, default: 0 },
  });

  pgm.createTable('escrow_holds', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    trip_id: { type: 'text', notNull: true },
    intent_id: { type: 'uuid', references: 'payment_intents', onDelete: 'SET NULL' },
    amount: { type: 'numeric(14,2)', notNull: true },
    currency: { type: 'text', notNull: true, default: 'GHS' },
    status: { type: 'text', notNull: true, default: 'held' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('escrow_holds', 'escrow_holds_status_check', "CHECK (status IN ('held','released','refunded','disputed'))");
  pgm.addIndex('escrow_holds', ['trip_id']);

  pgm.dropConstraint('payouts', 'payouts_status_check');
  pgm.addConstraint('payouts', 'payouts_status_check', "CHECK (status IN ('requested','queued','sent','settled','succeeded','failed'))");

  pgm.createTable('disputes', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    intent_id: { type: 'uuid', references: 'payment_intents', onDelete: 'SET NULL' },
    rider_id: { type: 'text', notNull: true },
    driver_id: { type: 'text' },
    amount: { type: 'numeric(14,2)', notNull: true },
    currency: { type: 'text', notNull: true, default: 'GHS' },
    status: { type: 'text', notNull: true, default: 'open' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('disputes', 'disputes_status_check', "CHECK (status IN ('open','resolved','refunded'))");

  pgm.createTable('refunds', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    intent_id: { type: 'uuid', references: 'payment_intents', onDelete: 'SET NULL' },
    amount: { type: 'numeric(14,2)', notNull: true },
    currency: { type: 'text', notNull: true, default: 'GHS' },
    status: { type: 'text', notNull: true, default: 'queued' },
    provider: { type: 'text' },
    provider_ref: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('refunds', 'refunds_status_check', "CHECK (status IN ('queued','sent','settled','failed'))");
};

exports.down = (pgm) => {
  pgm.dropTable('refunds');
  pgm.dropTable('disputes');
  pgm.dropTable('escrow_holds');

  pgm.dropColumns('payment_intents', ['phone', 'fees']);
  pgm.dropConstraint('payment_intents', 'payment_intents_status_check');
  pgm.addConstraint(
    'payment_intents',
    'payment_intents_status_check',
    "CHECK (status IN ('created','authorized','captured','failed','review','held'))"
  );

  pgm.dropConstraint('payouts', 'payouts_status_check');
  pgm.addConstraint('payouts', 'payouts_status_check', "CHECK (status IN ('queued','sent','settled','failed'))");

  pgm.dropIndex('ledger_entries', ['idempotency_key']);
  pgm.dropColumns('ledger_entries', ['debit_account_id', 'credit_account_id', 'currency', 'memo', 'event_type', 'idempotency_key']);

  pgm.dropTable('financial_accounts');
};
