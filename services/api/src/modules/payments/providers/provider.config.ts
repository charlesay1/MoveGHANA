import fs from 'fs';
import path from 'path';
import { config } from '../../../config/config';
import type { ProviderConfig, ProviderName } from './provider.interface';

const readJson = (filePath: string) => {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const isPlaceholder = (value?: string) => {
  if (!value) return true;
  const v = value.toLowerCase();
  return v.includes('change_me') || v.includes('placeholder') || v === '***';
};

export const loadProviderConfig = (name: ProviderName): ProviderConfig => {
  if (name === 'mock') {
    return {
      name,
      mode: config.PAYMENTS_PROVIDER_MODE,
      baseUrl: 'http://mock',
      apiKey: 'mock',
      apiSecret: 'mock',
      webhookSecret: config.PAYMENTS_WEBHOOK_SECRET,
      endpoints: { initiate: '/initiate', verify: '/verify', refund: '/refund', payout: '/payout' },
    };
  }

  const secretsDir = config.PAYMENTS_SECRETS_DIR || path.resolve(process.cwd(), 'services', 'api', 'secrets');
  const filename = name === 'mtn' ? 'momo.mtn.json' : name === 'vodafone' ? 'momo.vodafone.json' : 'momo.airteltigo.json';
  const filePath = path.join(secretsDir, filename);
  const json = readJson(filePath);
  if (!json) {
    throw new Error(`Missing provider secrets for ${name}.`);
  }

  const baseUrl = String(json.baseUrl || '');
  const apiKey = String(json.apiKey || '');
  const apiSecret = String(json.apiSecret || '');
  const webhookSecret = String(json.webhookSecret || config.PAYMENTS_WEBHOOK_SECRET || '');
  const merchantId = json.merchantId ? String(json.merchantId) : undefined;
  const endpoints = (json.endpoints || {}) as ProviderConfig['endpoints'];

  const cfg: ProviderConfig = {
    name,
    mode: config.PAYMENTS_PROVIDER_MODE,
    baseUrl,
    apiKey,
    apiSecret,
    webhookSecret,
    merchantId,
    endpoints: {
      initiate: String(endpoints.initiate || ''),
      verify: String(endpoints.verify || ''),
      refund: String(endpoints.refund || ''),
      payout: String(endpoints.payout || ''),
    },
  };

  if (config.PAYMENTS_PROVIDER_MODE === 'live') {
    if (!baseUrl || !apiKey || !apiSecret || !cfg.endpoints.initiate || !cfg.endpoints.verify || !cfg.endpoints.refund || !cfg.endpoints.payout) {
      throw new Error(`Provider ${name} is missing required secrets or endpoints.`);
    }
    if (isPlaceholder(apiKey) || isPlaceholder(apiSecret) || isPlaceholder(webhookSecret)) {
      throw new Error(`Provider ${name} secrets are placeholders.`);
    }
  }

  return cfg;
};
