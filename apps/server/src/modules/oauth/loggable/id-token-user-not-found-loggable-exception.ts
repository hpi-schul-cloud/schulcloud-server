import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class IdTokenUserNotFoundLoggableException extends BusinessError implements Loggable {
	constructor(private readonly uuid: string, private readonly additionalInfo?: string) {
		super(
			{
				type: 'USER_NOT_FOUND',
				title: 'User not found',
				defaultMessage: 'Failed to find user with uuid from id token.',
			},
			HttpStatus.NOT_FOUND
		);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: this.type,
			message: this.message,
			stack: this.stack,
			data: {
				uuid: this.uuid,
				additionalInfo: this.additionalInfo,
			},
		};
	}
}
