import { Injectable } from '@nestjs/common';

@Injectable()
export class ServerService {
  getHello(): string {
    return 'Hello World!';
  }
}
