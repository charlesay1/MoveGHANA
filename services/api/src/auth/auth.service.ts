import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { normalizeGhanaPhone, maskPhone } from './phone';
import { UsersService } from '../users/users.service';

const OTP_EXPIRY_MS = 1000 * 60 * 5;
const OTP_LOCK_MS = 1000 * 60;
const OTP_MAX_ATTEMPTS = 5;

const ERROR_INVALID_CODE = 'Invalid code. Try again.';
const ERROR_EXPIRED_CODE = 'Code expired. Resend a new code.';
const ERROR_TOO_MANY = 'Too many attempts. Please wait 1 minute and try again.';

type OtpRecord = {
  phone: string;
  code: string;
  expiresAt: number;
  attempts: number;
  lockedUntil: number | null;
};

@Injectable()
export class AuthService {
  // TODO: Move OTP storage into a database table when auth persistence is enabled.
  private readonly requests = new Map<string, OtpRecord>();
  private readonly jwtSecret = process.env.JWT_SECRET ?? '';

  constructor(private readonly users: UsersService) {}

  start(phone: string) {
    const normalized = normalizeGhanaPhone(phone);
    const requestId = randomUUID();
    const code = `${Math.floor(100000 + Math.random() * 900000)}`;
    const expiresAt = Date.now() + OTP_EXPIRY_MS;
    this.requests.set(requestId, {
      phone: normalized,
      code,
      expiresAt,
      attempts: 0,
      lockedUntil: null,
    });

    console.log(`[moveGH OTP] ${normalized} -> ${code}`);

    return {
      requestId,
      maskedPhone: maskPhone(normalized),
      expiresInSeconds: Math.floor(OTP_EXPIRY_MS / 1000),
    };
  }

  verify(requestId: string, code: string) {
    const request = this.requests.get(requestId);
    if (!request) throw new UnauthorizedException(ERROR_EXPIRED_CODE);
    if (request.expiresAt < Date.now()) {
      this.requests.delete(requestId);
      throw new UnauthorizedException(ERROR_EXPIRED_CODE);
    }

    if (request.lockedUntil && request.lockedUntil > Date.now()) {
      throw new UnauthorizedException(ERROR_TOO_MANY);
    }
    if (request.lockedUntil && request.lockedUntil <= Date.now()) {
      request.lockedUntil = null;
      request.attempts = 0;
    }

    if (!/^\d{6}$/.test(code)) {
      this.recordFailedAttempt(requestId, request);
      throw new BadRequestException(ERROR_INVALID_CODE);
    }

    if (request.code !== code) {
      this.recordFailedAttempt(requestId, request);
      throw new UnauthorizedException(ERROR_INVALID_CODE);
    }

    this.requests.delete(requestId);

    let user = this.users.findByPhone(request.phone);
    if (!user) {
      user = this.users.createRider(request.phone);
    }

    const token = jwt.sign({ sub: user.id, role: user.role }, this.jwtSecret, {
      expiresIn: '2h',
    });

    return { token, user: { id: user.id, phone: user.phone, role: 'rider' } };
  }

  private recordFailedAttempt(requestId: string, record: OtpRecord) {
    const attempts = record.attempts + 1;
    record.attempts = attempts;
    if (attempts >= OTP_MAX_ATTEMPTS) {
      record.lockedUntil = Date.now() + OTP_LOCK_MS;
      this.requests.set(requestId, record);
      throw new UnauthorizedException(ERROR_TOO_MANY);
    }
    this.requests.set(requestId, record);
  }
}
