import { UnauthorizedException } from '@nestjs/common';
import { Loggable } from '@src/core/logger/interfaces';
import { ErrorLogMessage } from '@src/core/logger/types';

export class UnauthorizedLoggableException extends UnauthorizedException implements Loggable {
	constructor(private readonly username: string, private readonly systemId?: string) {
		super();
	}

	getLogMessage(): ErrorLogMessage {
		const message = {
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
