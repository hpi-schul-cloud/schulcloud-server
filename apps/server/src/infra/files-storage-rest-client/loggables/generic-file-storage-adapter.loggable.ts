import { InternalServerErrorException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type LogMessageData } from '@shared/common/loggable/interfaces';

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
