import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { InternalServerErrorException } from '@nestjs/common';

export class UnknownQueryTypeLoggableException extends InternalServerErrorException implements Loggable {
	constructor(private readonly unknownQueryType: string) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'INTERNAL_SERVER_ERROR',
			stack: this.stack,
			message: 'Unable to process unknown query type for class years.',
			data: {
				unknownQueryType: this.unknownQueryType,
			},
		};
	}
}
