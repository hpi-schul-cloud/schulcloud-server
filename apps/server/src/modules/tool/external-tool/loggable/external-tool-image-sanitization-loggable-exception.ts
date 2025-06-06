import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';

export class ExternalToolImageSanitizationLoggableException extends BusinessError implements Loggable {
	constructor() {
		super(
			{
				type: 'IMAGE_SANITIZATION_FAILED',
				title: 'Image sanitization failed.',
				defaultMessage: 'Image sanitization failed.',
			},
			HttpStatus.UNPROCESSABLE_ENTITY
		);
	}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: this.type,
			message: this.message,
			stack: this.stack,
		};
	}
}
