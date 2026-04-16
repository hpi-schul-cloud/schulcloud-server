import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { BadRequestException } from '@nestjs/common';

export class ExternalIdMissingLoggableException extends BadRequestException implements Loggable {
	constructor(private readonly context: string, private readonly additionalInfo?: Record<string, unknown>) {
		super();
	}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'EXTERNAL_ID_MISSING',
			message: `External ID is missing in ${this.context}`,
			stack: this.stack,
			data: {
				context: this.context,
				...this.additionalInfo,
			},
		};
	}
}
