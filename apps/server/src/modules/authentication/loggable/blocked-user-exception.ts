import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';
import { ErrorLogMessage, Loggable } from '@src/core/logger';

export class DeactivatedUserAccountException extends BusinessError implements Loggable {
	constructor() {
		super(
			{
				type: 'DEACTIVATED_USER_ACCOUNT',
				title: 'Login failed because user accout is deactivated',
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
