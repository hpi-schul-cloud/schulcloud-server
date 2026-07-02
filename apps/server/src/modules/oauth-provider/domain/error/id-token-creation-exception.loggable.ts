import { ErrorLogMessage, Loggable } from '@infra/logger';
import { InternalServerErrorException } from '@nestjs/common';

export class IdTokenCreationLoggableException extends InternalServerErrorException implements Loggable {
	constructor(
		private readonly clientId: string,
		private readonly userId?: string
	) {
		super();
	}

	getLogMessage(): ErrorLogMessage {
		const message = {
			type: 'INTERNAL_SERVER_ERROR_EXCEPTION',
			message: 'Something went wrong for id token creation. Tool could not be found.',
			stack: this.stack,
			data: {
				userId: this.userId,
				clientId: this.clientId,
			},
		};

		return message;
	}
}
