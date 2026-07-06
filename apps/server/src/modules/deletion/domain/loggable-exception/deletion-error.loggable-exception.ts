import { AxiosErrorLoggable } from '@infra/error';
import { InternalServerErrorException } from '@nestjs/common';
import { Loggable, LoggableMessage } from '@shared/common/loggable';
import { isAxiosError } from 'axios';
export class DeletionErrorLoggableException extends InternalServerErrorException implements Loggable {
	constructor(
		private readonly errorMessage: string,
		private readonly error?: Error
	) {
		super();
	}

	public getLogMessage(): LoggableMessage {
		let { error } = this;
		if (isAxiosError(this.error)) {
			error = new AxiosErrorLoggable(this.error, 'DELETION_3RD_PARTY_ERROR');
		}
		const message: LoggableMessage = {
			type: 'DELETION_ERROR',
			stack: this.stack,
			data: {
				errorMessage: this.errorMessage,
			},
			error,
		};

		return message;
	}
}
