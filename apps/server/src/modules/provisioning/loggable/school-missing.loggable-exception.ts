import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { ExternalUserDto } from '../dto';

export class SchoolMissingLoggableException extends BusinessError implements Loggable {
	constructor(private readonly externalUser: ExternalUserDto) {
		super(
			{
				type: 'SCHOOL_MISSING',
				title: 'Invalid school data',
				defaultMessage: 'Unable to create new external user without a school',
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
