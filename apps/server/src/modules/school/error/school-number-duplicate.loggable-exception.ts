import { NotImplementedException } from '@nestjs/common';
import { SchoolDO } from '@shared/domain';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class SchoolNumberDuplicateLoggableException extends NotImplementedException implements Loggable {
	constructor(private readonly school: SchoolDO) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'SCHOOL_NUMBER_DUPLICATE',
			message: 'Unable to save the school. A school with this official school number does already exist.',
			stack: this.stack,
			data: {
				officialSchoolNumber: this.school.officialSchoolNumber,
			},
		};
	}
}
