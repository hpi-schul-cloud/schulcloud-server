import { UnauthorizedException } from '@nestjs/common';
import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class UnauthorizedLoggableException extends UnauthorizedException implements Loggable {
	constructor(
		private readonly username: string,
		private readonly systemId?: string
	) {
		super();
	}

	getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
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
