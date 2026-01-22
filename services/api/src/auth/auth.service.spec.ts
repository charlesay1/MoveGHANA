import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService OTP lockout', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  it('locks after too many attempts', () => {
    const service = new AuthService(new UsersService());
    const { requestId } = service.start('0241234567');

    for (let i = 0; i < 4; i += 1) {
      expect(() => service.verify(requestId, '000000')).toThrow('Invalid code. Try again.');
    }

    expect(() => service.verify(requestId, '000000')).toThrow(
      'Too many attempts. Please wait 1 minute and try again.',
    );
  });
});
