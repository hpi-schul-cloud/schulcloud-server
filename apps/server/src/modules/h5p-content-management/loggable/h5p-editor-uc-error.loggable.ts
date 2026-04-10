import { Loggable } from '@core/logger';
import { ErrorLogMessage, LogMessageDataObject } from '@core/logger/types';
import { InternalServerErrorException } from '@nestjs/common';

export class H5PUcErrorLoggable extends InternalServerErrorException implements Loggable {
	constructor(
		private readonly error: unknown,
		private readonly data: LogMessageDataObject = {},
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
			type: 'H5P UC Error',
		};

		return logMessage;
	}
}
