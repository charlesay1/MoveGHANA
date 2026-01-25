import crypto from 'crypto';
import { ProviderConfig, ProviderContext } from './provider.interface';

export type ProviderResponse<T> = { status: number; data: T };

type CircuitState = {
  failures: number;
  openUntil: number;
};

export class ProviderBase {
  private readonly circuit: CircuitState = { failures: 0, openUntil: 0 };

  constructor(protected readonly config: ProviderConfig) {}

  protected async request<T>(
    method: 'POST' | 'GET',
    path: string,
    body: Record<string, unknown> | undefined,
    ctx: ProviderContext
  ): Promise<ProviderResponse<T>> {
    const url = `${this.config.baseUrl}${path}`;
    const now = Date.now();
    if (this.circuit.openUntil > now) {
      throw new Error('Provider circuit breaker open');
    }

    const payload = body ? JSON.stringify(body) : '';
    const timestamp = new Date().toISOString();
    const nonce = crypto.randomUUID();
    const signature = this.sign(payload, timestamp, nonce);

    const headers = {
      'Content-Type': 'application/json',
      'X-Request-Id': ctx.requestId || ctx.correlationId,
      'X-Correlation-Id': ctx.correlationId,
      'X-Idempotency-Key': ctx.idempotencyKey,
      'X-Timestamp': timestamp,
      'X-Nonce': nonce,
      'X-Signature': signature,
      Authorization: `Bearer ${this.config.apiKey}`,
    };

    const maxAttempts = 3;
    let delay = 200;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const res = await fetch(url, {
          method,
          headers,
          body: payload || undefined,
        });

        const text = await res.text();
        let data: T;
        try {
          data = text ? (JSON.parse(text) as T) : ({} as T);
        } catch {
          data = {} as T;
        }

        if (!res.ok) {
          if (res.status >= 500 && attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2;
            continue;
          }
          this.recordFailure();
          return { status: res.status, data };
        }

        this.resetCircuit();
        return { status: res.status, data };
      } catch (error) {
        if (attempt >= maxAttempts) {
          this.recordFailure();
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }

    throw new Error('Provider request failed');
  }

  protected verifySignature(payload: string, timestamp: string, nonce: string, signature: string) {
    const expected = this.sign(payload, timestamp, nonce);
    if (expected.length !== signature.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  }

  protected verifyWebhookSignature(payload: string, timestamp: string, nonce: string, signature: string) {
    const content = `${timestamp}.${nonce}.${payload}`;
    const expected = crypto.createHmac('sha256', this.config.webhookSecret).update(content).digest('hex');
    if (expected.length !== signature.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  }

  private sign(payload: string, timestamp: string, nonce: string) {
    const content = `${timestamp}.${nonce}.${payload}`;
    return crypto.createHmac('sha256', this.config.apiSecret).update(content).digest('hex');
  }

  private recordFailure() {
    this.circuit.failures += 1;
    if (this.circuit.failures >= 3) {
      this.circuit.openUntil = Date.now() + 30_000;
    }
  }

  private resetCircuit() {
    this.circuit.failures = 0;
    this.circuit.openUntil = 0;
  }
}
