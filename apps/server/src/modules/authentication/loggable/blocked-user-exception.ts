import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';
import { ErrorLogMessage, Loggable } from '@src/core/logger';

export class BlockedUserException extends BusinessError implements Loggable {
	constructor() {
		super(
			{
				type: 'BLOCKED_USER',
				title: 'Login failed because user is blocked',
				defaultMessage: 'Login failed because user is blocked',
			},
			HttpStatus.UNAUTHORIZED
		);
	}

	getLogMessage(): ErrorLogMessage {
		return {
			type: this.type,
			stack: this.stack,
		};
	}
}