import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { normalizeGhanaPhone, maskPhone } from './phone';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  private readonly requests = new Map<
    string,
    { phone: string; code: string; expiresAt: number }
  >();
  private readonly jwtSecret = process.env.JWT_SECRET ?? '';

  constructor(private readonly users: UsersService) {}

  start(phone: string) {
    const normalized = normalizeGhanaPhone(phone);
    const requestId = randomUUID();
    const code = `${Math.floor(100000 + Math.random() * 900000)}`;
    const expiresAt = Date.now() + 1000 * 60 * 5;
    this.requests.set(requestId, { phone: normalized, code, expiresAt });

    console.log(`[moveGH OTP] ${normalized} -> ${code}`);

    return { requestId, maskedPhone: maskPhone(normalized) };
  }

  verify(requestId: string, code: string) {
    const request = this.requests.get(requestId);
    if (!request) throw new UnauthorizedException('Invalid or expired request.');
    if (request.expiresAt < Date.now()) {
      this.requests.delete(requestId);
      throw new UnauthorizedException('OTP expired. Please request a new code.');
    }
    if (request.code !== code) {
      throw new UnauthorizedException('Invalid code. Please try again.');
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
}
