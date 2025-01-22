import { UnauthorizedException } from '@nestjs/common';
import { Loggable } from '@core/logger/interfaces';
import { ErrorLogMessage } from '@core/logger/types';

export class UnauthorizedLoggableException extends UnauthorizedException implements Loggable {
	constructor(private readonly username: string, private readonly systemId?: string) {
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
