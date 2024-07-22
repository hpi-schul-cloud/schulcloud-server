import { Injectable } from '@nestjs/common';

@Injectable()
export class ConsoleWriterService {
	info(text: string): void {
		// eslint-disable-next-line no-console
		console.info('Info:', text);
	}

	error(text: string): void {
		// eslint-disable-next-line no-console
		console.error('Error:', text);
	}
}
