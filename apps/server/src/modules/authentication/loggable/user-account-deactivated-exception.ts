import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';
import { ErrorLogMessage, Loggable } from '@src/core/logger';

export class UserAccountDeactivatedLoggableException extends BusinessError implements Loggable {
	constructor() {
		super(
			{
				type: 'USER_ACCOUNT_DEACTIVATED',
				title: 'Login failed because user account is deactivated',
				defaultMessage: 'Login failed because user account is deactivated',
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
