import { UnprocessableEntityException } from '@nestjs/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class ExternalSchoolNumberMissingLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(private readonly schoolExternalId: string) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'EXTERNAL_SCHOOL_NUMBER_MISSING',
			message: 'The external system did not provide a official school number for the school.',
			stack: this.stack,
			data: {
				schoolExternalId: this.schoolExternalId,
			},
		};
	}
}
