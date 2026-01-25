'use strict';

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns('payment_intents', {
    risk_score: { type: 'numeric(5,2)', notNull: true, default: 0 },
    risk_status: { type: 'text', notNull: true, default: 'clear' },
    risk_reason: { type: 'text' },
    device_id: { type: 'text' },
    phone_hash: { type: 'text' },
  });

  pgm.dropConstraint('payment_intents', 'payment_intents_status_check');
  pgm.addConstraint(
    'payment_intents',
    'payment_intents_status_check',
    "CHECK (status IN ('created','authorized','captured','failed','review','held'))"
  );

  pgm.addIndex('payment_intents', ['device_id']);
  pgm.addIndex('payment_intents', ['phone_hash']);
  pgm.addIndex('payment_intents', ['risk_status']);

  pgm.createTable('fraud_flags', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    intent_id: { type: 'uuid', references: 'payment_intents', onDelete: 'SET NULL' },
    rider_id: { type: 'text', notNull: true },
    flag_type: { type: 'text', notNull: true },
    score: { type: 'integer', notNull: true, default: 0 },
    details: { type: 'jsonb', notNull: true, default: '{}' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addIndex('fraud_flags', ['intent_id']);
  pgm.addIndex('fraud_flags', ['rider_id']);

  pgm.createTable('risk_profiles', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    owner_type: { type: 'text', notNull: true },
    owner_id: { type: 'text', notNull: true },
    status: { type: 'text', notNull: true, default: 'clear' },
    risk_score: { type: 'numeric(5,2)', notNull: true, default: 0 },
    notes: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('risk_profiles', 'risk_profiles_owner_check', "CHECK (owner_type IN ('rider','driver'))");
  pgm.addConstraint('risk_profiles', 'risk_profiles_status_check', "CHECK (status IN ('clear','review','blocked'))");
  pgm.addIndex('risk_profiles', ['owner_type', 'owner_id'], { unique: true });

  pgm.createTable('blocked_accounts', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    owner_type: { type: 'text', notNull: true },
    owner_id: { type: 'text' },
    phone_hash: { type: 'text' },
    device_hash: { type: 'text' },
    reason: { type: 'text' },
    blocked_until: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addIndex('blocked_accounts', ['owner_type', 'owner_id']);
  pgm.addIndex('blocked_accounts', ['phone_hash']);
  pgm.addIndex('blocked_accounts', ['device_hash']);

  pgm.createTable('settlements', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    provider: { type: 'text', notNull: true },
    currency: { type: 'text', notNull: true, default: 'GHS' },
    period_start: { type: 'date', notNull: true },
    period_end: { type: 'date', notNull: true },
    ledger_total: { type: 'numeric(14,2)', notNull: true, default: 0 },
    provider_total: { type: 'numeric(14,2)' },
    drift_amount: { type: 'numeric(14,2)' },
    status: { type: 'text', notNull: true, default: 'pending' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('settlements', 'settlements_status_check', "CHECK (status IN ('pending','matched','mismatch'))");
  pgm.addIndex('settlements', ['provider']);

  pgm.createTable('settlement_batches', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    settlement_id: { type: 'uuid', notNull: true, references: 'settlements', onDelete: 'CASCADE' },
    payout_count: { type: 'integer', notNull: true, default: 0 },
    total_amount: { type: 'numeric(14,2)', notNull: true, default: 0 },
    status: { type: 'text', notNull: true, default: 'pending' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('settlement_batches', 'settlement_batches_status_check', "CHECK (status IN ('pending','sent','settled','failed'))");
  pgm.addIndex('settlement_batches', ['settlement_id']);

  pgm.createTable('reconciliation_reports', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    settlement_id: { type: 'uuid', notNull: true, references: 'settlements', onDelete: 'CASCADE' },
    report: { type: 'jsonb', notNull: true, default: '{}' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addIndex('reconciliation_reports', ['settlement_id']);
};

exports.down = (pgm) => {
  pgm.dropTable('reconciliation_reports');
  pgm.dropTable('settlement_batches');
  pgm.dropTable('settlements');
  pgm.dropTable('blocked_accounts');
  pgm.dropTable('risk_profiles');
  pgm.dropTable('fraud_flags');

  pgm.dropIndex('payment_intents', ['risk_status']);
  pgm.dropIndex('payment_intents', ['phone_hash']);
  pgm.dropIndex('payment_intents', ['device_id']);

  pgm.dropConstraint('payment_intents', 'payment_intents_status_check');
  pgm.addConstraint(
    'payment_intents',
    'payment_intents_status_check',
    "CHECK (status IN ('created','authorized','captured','failed'))"
  );

  pgm.dropColumns('payment_intents', ['risk_score', 'risk_status', 'risk_reason', 'device_id', 'phone_hash']);
};
