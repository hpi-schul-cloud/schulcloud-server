import { Injectable } from '@nestjs/common';
import { createSpinner } from 'nestjs-console';
import * as ora from 'ora';

@Injectable()
/**
 * Console writer service using ora spinner internally.
 */
export class ConsoleWriterService {
	private spinner: ora.Ora = createSpinner();

	info(text: string): void {
		this.spinner.info(text);
	}
}
