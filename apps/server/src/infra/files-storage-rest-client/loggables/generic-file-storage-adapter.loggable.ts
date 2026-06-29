import { Loggable, LogMessage, LogMessageData } from '@core/logger';
import { InternalServerErrorException } from '@nestjs/common';

export class GenericFileStorageLoggable extends InternalServerErrorException implements Loggable {
	constructor(
		public readonly message: string,
		private readonly error: unknown,
		private readonly data?: LogMessageData
	) {
		super(message);
	}

	public getLogMessage(): LogMessage {
		this.cause = this.error || 'An unknown error occurred in the GenericFileStorageLoggable';
		return {
			message: this.message,
			data: this.data,
		};
	}
}
