import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  hashPassword(password: string, rounds = 12) {
    return bcrypt.hash(password, rounds);
  }

  verifyPassword(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }
}
