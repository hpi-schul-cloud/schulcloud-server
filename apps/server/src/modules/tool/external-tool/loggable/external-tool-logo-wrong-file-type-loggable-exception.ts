import { BusinessError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { HttpStatus } from '@nestjs/common';

export class ExternalToolLogoWrongFileTypeLoggableException extends BusinessError implements Loggable {
	constructor() {
		super(
			{
				type: 'EXTERNAL_TOOL_LOGO_WRONG_FILE_TYPE',
				title: 'External tool logo wrong file type.',
				defaultMessage: 'External tool logo has the wrong file type. Only JPEG and PNG files are supported.',
			},
			HttpStatus.BAD_REQUEST
		);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'EXTERNAL_TOOL_LOGO_WRONG_FILE_TYPE',
			message: 'External tool logo has the wrong file type. Only JPEG and PNG files are supported.',
			stack: this.stack,
		};
	}
}
