import { ErrorLogMessage, Loggable } from '@infra/logger';
import { UnauthorizedException } from '@nestjs/common';

export class UnauthorizedLoggableException extends UnauthorizedException implements Loggable {
	constructor(
		private readonly username: string,
		private readonly systemId?: string
	) {
		super();
	}

	getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
			type: 'UNAUTHORIZED_EXCEPTION',
			stack: this.stack,
			data: {
				userName: this.username,
				systemId: this.systemId,
			},
		};

		return message;
	}
}
