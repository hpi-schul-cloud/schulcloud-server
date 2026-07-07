import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';
import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class ExternalToolLogoSanitizationLoggableException extends BusinessError implements Loggable {
	constructor(private readonly sanitizerError: string) {
		super(
			{
				type: 'IMAGE_SANITIZATION_FAILED',
				title: 'Image sanitization failed.',
				defaultMessage: 'Image sanitization failed.',
			},
			HttpStatus.UNPROCESSABLE_ENTITY
		);
	}

	public getLogMessage(): LoggableMessage {
		return {
			type: this.type,
			message: this.message,
			stack: this.stack,
			data: {
				sanitizerError: this.sanitizerError,
			},
		};
	}
}
