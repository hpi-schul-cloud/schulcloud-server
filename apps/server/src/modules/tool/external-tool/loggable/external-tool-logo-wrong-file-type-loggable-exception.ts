import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';

export class ExternalToolLogoWrongFileTypeLoggableException extends BusinessError implements Loggable {
	constructor() {
		super(
			{
				type: 'EXTERNAL_TOOL_LOGO_WRONG_FILE_TYPE',
				title: 'External tool logo wrong file type.',
				defaultMessage: 'External tool logo has the wrong file type. Only JPEG, PNG, SVG and GIF files are supported.',
			},
			HttpStatus.BAD_REQUEST
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
