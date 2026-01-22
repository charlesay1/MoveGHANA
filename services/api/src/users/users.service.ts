import { Injectable } from '@nestjs/common';

type UserRecord = {
  id: string;
  role: 'rider';
  phone: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

@Injectable()
export class UsersService {
  private readonly users: UserRecord[] = [];

  findByPhone(phone: string): UserRecord | undefined {
    return this.users.find((user) => user.phone === phone);
  }

  findById(id: string): UserRecord | undefined {
    return this.users.find((user) => user.id === id);
  }

  createRider(phone: string): UserRecord {
    const user: UserRecord = {
      id: `user_${this.users.length + 1}`,
      role: 'rider',
      phone,
    };
    this.users.push(user);
    return user;
  }

  getMe(id: string) {
    return this.findById(id);
  }

  updateProfile(id: string, body: { firstName: string; lastName?: string; email?: string }) {
    const user = this.findById(id);
    if (!user) return undefined;
    user.firstName = body.firstName;
    user.lastName = body.lastName;
    user.email = body.email;
    return user;
  }
}
