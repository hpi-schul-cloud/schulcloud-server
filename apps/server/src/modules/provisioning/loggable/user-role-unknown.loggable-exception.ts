import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';
import { ExternalUserDto } from '../dto';

export class UserRoleUnknownLoggableException extends BusinessError implements Loggable {
	constructor(private readonly externalUser: ExternalUserDto) {
		super(
			{
				type: 'EXTERNAL_USER_ROLE_UNKNOWN',
				title: 'Invalid user role',
				defaultMessage: 'External user has no or no known role assigned to them',
			},
			HttpStatus.UNPROCESSABLE_ENTITY
		);
	}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: this.type,
			message: this.message,
			stack: this.stack,
			data: {
				externalUserId: this.externalUser.externalId,
			},
		};
	}
}
