import { Injectable } from '@nestjs/common';
import crypto from 'crypto';
import type { PoolClient } from 'pg';
import { config } from '../../config/config';

export type FraudAssessment = {
  status: 'clear' | 'review' | 'blocked';
  score: number;
  reasons: string[];
  phoneHash?: string;
  deviceHash?: string;
};

export type FraudRiskInput = {
  riderId: string;
  amount: number;
  currency: string;
  phoneNumber?: string;
  deviceId?: string;
  ip?: string;
  country?: string;
};

@Injectable()
export class FraudService {
  async assessPaymentRisk(client: PoolClient, input: FraudRiskInput): Promise<FraudAssessment> {
    const reasons: string[] = [];
    let score = 0;

    const phoneHash = input.phoneNumber ? this.hashValue(input.phoneNumber) : undefined;
    const deviceHash = input.deviceId ? this.hashValue(input.deviceId) : undefined;

    const blocked = await this.checkBlocked(client, input.riderId, phoneHash, deviceHash);
    if (blocked) {
      reasons.push('blocked_account');
      score = config.FRAUD_BLOCK_SCORE;
      await this.upsertRiskProfile(client, input.riderId, 'blocked', score, reasons.join(';'));
      return { status: 'blocked', score, reasons, phoneHash, deviceHash };
    }

    if (input.amount > config.FRAUD_MAX_AMOUNT) {
      score += 40;
      reasons.push('amount_threshold');
    }

    const riderPerMin = await this.countRecent(client, 'rider_id', input.riderId, '1 minute');
    if (riderPerMin >= config.FRAUD_RIDER_PER_MIN) {
      score += 30;
      reasons.push('velocity_rider_min');
    }

    const riderPerDay = await this.countRecent(client, 'rider_id', input.riderId, '24 hours');
    if (riderPerDay >= config.FRAUD_RIDER_PER_DAY) {
      score += 20;
      reasons.push('velocity_rider_day');
    }

    if (deviceHash) {
      const devicePerDay = await this.countRecent(client, 'device_id', deviceHash, '24 hours');
      if (devicePerDay >= config.FRAUD_DEVICE_PER_DAY) {
        score += 15;
        reasons.push('velocity_device_day');
      }
    }

    if (phoneHash) {
      const phonePerDay = await this.countRecent(client, 'phone_hash', phoneHash, '24 hours');
      if (phonePerDay >= config.FRAUD_PHONE_PER_DAY) {
        score += 15;
        reasons.push('velocity_phone_day');
      }
    }

    if (input.country && input.country.toUpperCase() !== 'GH') {
      score += 20;
      reasons.push('geo_mismatch');
    }

    if (score < 0) score = 0;
    if (score > 100) score = 100;

    const status = score >= config.FRAUD_BLOCK_SCORE ? 'blocked' : score >= config.FRAUD_HOLD_SCORE ? 'review' : 'clear';

    await this.upsertRiskProfile(client, input.riderId, status, score, reasons.join(';'));
    return { status, score, reasons, phoneHash, deviceHash };
  }

  private async checkBlocked(client: PoolClient, riderId: string, phoneHash?: string, deviceHash?: string) {
    const res = await client.query<{
      id: string;
      reason: string | null;
    }>(
      `SELECT id, reason FROM blocked_accounts
       WHERE (
         (owner_type = 'rider' AND owner_id = $1)
         OR (phone_hash IS NOT NULL AND phone_hash = $2)
         OR (device_hash IS NOT NULL AND device_hash = $3)
       )
       AND (blocked_until IS NULL OR blocked_until > now())
       LIMIT 1`,
      [riderId, phoneHash ?? null, deviceHash ?? null]
    );
    return res.rows[0]?.reason || null;
  }

  private async countRecent(client: PoolClient, column: 'rider_id' | 'device_id' | 'phone_hash', value: string, interval: string) {
    const res = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM payment_intents WHERE ${column} = $1 AND created_at > now() - interval '${interval}'`,
      [value]
    );
    return Number(res.rows[0]?.count || 0);
  }

  async recordFlags(client: PoolClient, params: { intentId: string; riderId: string; reasons: string[]; score: number; details: Record<string, unknown> }) {
    for (const reason of params.reasons) {
      await client.query(
        'INSERT INTO fraud_flags (intent_id, rider_id, flag_type, score, details) VALUES ($1, $2, $3, $4, $5)',
        [params.intentId, params.riderId, reason, params.score, JSON.stringify(params.details)]
      );
    }
  }

  private async upsertRiskProfile(client: PoolClient, riderId: string, status: string, score: number, notes: string) {
    await client.query(
      `INSERT INTO risk_profiles (owner_type, owner_id, status, risk_score, notes)
       VALUES ('rider', $1, $2, $3, $4)
       ON CONFLICT (owner_type, owner_id)
       DO UPDATE SET status = EXCLUDED.status, risk_score = EXCLUDED.risk_score, notes = EXCLUDED.notes, updated_at = now()`,
      [riderId, status, score, notes]
    );
  }

  private hashValue(value: string) {
    return crypto.createHash('sha256').update(value).digest('hex');
  }
}
