import { Injectable } from '@nestjs/common';

@Injectable()
export class ConsoleWriterService {
	public info(text: string): void {
		console.info('Info:', text);
	}

	public error(text: string): void {
		console.error('Error:', text);
	}
}
