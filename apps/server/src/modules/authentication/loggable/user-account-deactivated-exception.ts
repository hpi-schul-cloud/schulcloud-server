import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

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

	getLogMessage(): LoggableMessage {
		return {
			type: this.type,
			stack: this.stack,
		};
	}
}
