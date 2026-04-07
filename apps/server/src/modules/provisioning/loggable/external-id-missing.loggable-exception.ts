import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { BadRequestException } from '@nestjs/common';

export class ExternalIdMissingLoggableException extends BadRequestException implements Loggable {
	constructor(private readonly fieldName: string, private readonly additionalInfo?: Record<string, unknown>) {
		super();
	}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'EXTERNAL_ID_MISSING',
			message: `External ID is missing for field: ${this.fieldName}`,
			stack: this.stack,
			data: {
				fieldName: this.fieldName,
				...this.additionalInfo,
			},
		};
	}
}
