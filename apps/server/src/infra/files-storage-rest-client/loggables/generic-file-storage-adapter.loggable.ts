import { InternalServerErrorException } from '@nestjs/common';
import { Loggable, LoggableMessage } from '@shared/common/loggable';
import { LogMessageData } from '@shared/common/loggable/interfaces';

export class GenericFileStorageLoggable extends InternalServerErrorException implements Loggable {
	constructor(
		public readonly message: string,
		private readonly error: unknown,
		private readonly data?: LogMessageData
	) {
		super(message);
	}

	public getLogMessage(): LoggableMessage {
		this.cause = this.error || 'An unknown error occurred in the GenericFileStorageLoggable';
		return {
			message: this.message,
			data: this.data,
		};
	}
}
