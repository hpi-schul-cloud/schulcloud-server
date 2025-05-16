import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';

export class ExternalToolLogoWrongFormatLoggableException extends BusinessError implements Loggable {
	constructor(private readonly toolId: string) {
		super(
			{
				type: 'EXTERNAL_TOOL_LOGO_WRONG_FORMAT',
				title: 'External tool logo wrong format.',
				defaultMessage: 'External tool logo has the wrong data format. A data url is required.',
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
				toolId: this.toolId,
			},
		};
	}
}
