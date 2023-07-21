import { UnprocessableEntityException } from '@nestjs/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class SchoolNumberDuplicateLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(private readonly officialSchoolNumber: string) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'SCHOOL_NUMBER_DUPLICATE',
			message: 'Unable to save the school. A school with this official school number does already exist.',
			stack: this.stack,
			data: {
				officialSchoolNumber: this.officialSchoolNumber,
			},
		};
	}
}
