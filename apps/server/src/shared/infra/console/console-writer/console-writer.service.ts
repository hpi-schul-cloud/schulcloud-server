import { Injectable } from '@nestjs/common';
import { createSpinner } from 'nestjs-console';
import ora from 'ora';

@Injectable()
/**
 * Console writer service using ora spinner internally.
 */
export class ConsoleWriterService {
	private spinner: ora.Ora = createSpinner();

	start(): void {
		this.spinner.start();
	}

	info(text?: string): void {
		this.spinner.info(text);
	}

	warn(text?: string): void {
		this.spinner.warn(text);
	}

	succeed(text?: string): void {
		this.spinner.succeed(text);
	}
}
