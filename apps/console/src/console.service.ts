import { Injectable } from '@nestjs/common';

@Injectable()
export class ConsoleService {
	getHello(): string {
		return 'Hello World!';
	}
}
