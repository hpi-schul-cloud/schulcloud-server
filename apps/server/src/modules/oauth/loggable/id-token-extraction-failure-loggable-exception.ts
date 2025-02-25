import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';

export class IdTokenExtractionFailureLoggableException extends BusinessError implements Loggable {
	constructor(private readonly fieldName: string | string[], details?: Record<string, unknown>) {
		super(
			{
				type: 'ID_TOKEN_EXTRACTION_FAILURE',
				title: 'Id token extraction failure',
				defaultMessage: 'Failed to extract field',
			},
			HttpStatus.INTERNAL_SERVER_ERROR,
			details
		);
	}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		const logData = Array.isArray(this.fieldName) ? this.fieldName.join(', ') : this.fieldName;
		return {
			type: this.type,
			message: this.message,
			stack: this.stack,
			data: {
				fieldName: logData,
				...this.details,
			},
		};
	}
}
