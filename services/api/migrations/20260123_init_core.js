'use strict';

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createExtension('pgcrypto', { ifNotExists: true });

  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    phone_e164: { type: 'text', notNull: true, unique: true },
    first_name: { type: 'text', notNull: true },
    last_name: { type: 'text' },
    email: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addIndex('users', 'email', { unique: true, where: 'email IS NOT NULL' });

  pgm.createTable('otp_codes', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    phone_e164: { type: 'text', notNull: true },
    code_hash: { type: 'text', notNull: true },
    expires_at: { type: 'timestamptz', notNull: true },
    attempts: { type: 'integer', notNull: true, default: 0 },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addIndex('otp_codes', 'phone_e164');
  pgm.addIndex('otp_codes', 'expires_at');

  pgm.createTable('sessions', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    refresh_token_hash: { type: 'text', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    expires_at: { type: 'timestamptz', notNull: true },
  });
  pgm.addIndex('sessions', 'user_id');
  pgm.addIndex('sessions', 'expires_at');
};

exports.down = (pgm) => {
  pgm.dropTable('sessions');
  pgm.dropTable('otp_codes');
  pgm.dropTable('users');
};
