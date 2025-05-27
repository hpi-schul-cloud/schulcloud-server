import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';

export class UnknownLogoFileTypeLoggableException extends BusinessError implements Loggable {
	constructor() {
		super(
			{
				type: 'UNKNOWN_LOGO_FILE_TYPE',
				title: 'Unknown logo file type',
				defaultMessage: 'The provided logo has the wrong file type. Only JPEG, PNG and GIF files are supported.',
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
