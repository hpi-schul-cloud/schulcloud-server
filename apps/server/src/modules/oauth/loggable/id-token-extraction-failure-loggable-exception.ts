import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class IdTokenExtractionFailureLoggableException extends BusinessError implements Loggable {
	constructor(private readonly fieldName: string) {
		super(
			{
				type: 'ID_TOKEN_EXTRACTION_FAILURE',
				title: 'Id token extraction failure',
				defaultMessage: 'Failed to extract field',
			},
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: this.type,
			message: this.message,
			stack: this.stack,
			data: {
				fieldName: this.fieldName,
			},
		};
	}
}
