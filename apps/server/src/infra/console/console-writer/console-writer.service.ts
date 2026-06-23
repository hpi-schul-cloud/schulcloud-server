import { Injectable } from '@nestjs/common';

@Injectable()
export class ConsoleWriterService {
	info(text: string): void {
		console.info('Info:', text);
	}

	error(text: string): void {
		console.error('Error:', text);
	}
}
