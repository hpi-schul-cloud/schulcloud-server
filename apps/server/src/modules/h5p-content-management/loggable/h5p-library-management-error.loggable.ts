import { Loggable } from '@core/logger';
import { ErrorLogMessage } from '@core/logger/types';
import { InternalServerErrorException } from '@nestjs/common';

export class H5PLibraryManagementErrorLoggable extends InternalServerErrorException implements Loggable {
	constructor(
		private readonly error: unknown,
		private readonly data: Record<string, string> = {},
		private readonly context?: string
	) {
		super();
	}

	// istanbul ignore next
	public getLogMessage(): ErrorLogMessage {
		const context = this.context || '';
		const error = this.error instanceof Error ? this.error : new Error(`Unknown error ${context}.`);

		const logMessage = {
			error,
			data: this.data,
			stack: this.stack,
			type: 'Install H5P Content Type Error',
		};

		return logMessage;
	}
}
