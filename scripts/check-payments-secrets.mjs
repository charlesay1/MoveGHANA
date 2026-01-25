import fs from 'fs';
import path from 'path';

const secretsDir = path.resolve('services', 'api', 'secrets');
const requiredFiles = [
  'momo.mtn.json',
  'momo.vodafone.json',
  'momo.airteltigo.json',
  'platform.json',
];

const isPlaceholder = (value) => {
  if (!value) return true;
  const v = String(value).toLowerCase();
  return v.includes('change_me') || v.includes('placeholder') || v === '***';
};

const strict = process.env.STRICT_SECRETS === '1';
const errors = [];

for (const file of requiredFiles) {
  const filePath = path.join(secretsDir, file);
  if (!fs.existsSync(filePath)) {
    errors.push(`Missing secrets file: ${file}`);
    continue;
  }
  if (file.endsWith('.json')) {
    const raw = fs.readFileSync(filePath, 'utf8');
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      errors.push(`Invalid JSON: ${file}`);
      continue;
    }
    if (file.startsWith('momo.')) {
      const requiredKeys = ['baseUrl', 'apiKey', 'apiSecret', 'webhookSecret', 'endpoints'];
      for (const key of requiredKeys) {
        if (!(key in data)) errors.push(`Missing ${key} in ${file}`);
      }
      if (!data.endpoints || !data.endpoints.initiate || !data.endpoints.verify || !data.endpoints.refund || !data.endpoints.payout) {
        errors.push(`Missing endpoints in ${file}`);
      }
      if (strict) {
        if (isPlaceholder(data.apiKey) || isPlaceholder(data.apiSecret) || isPlaceholder(data.webhookSecret)) {
          errors.push(`Placeholder secrets in ${file}`);
        }
      }
    }
  }
}

if (errors.length > 0) {
  console.error(`Payments secrets checks failed: ${errors.join('; ')}`);
  process.exit(1);
}

console.log('Payments secrets checks passed');
