import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  health() {
    return {
      name: 'Moura Patient Platform API',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
