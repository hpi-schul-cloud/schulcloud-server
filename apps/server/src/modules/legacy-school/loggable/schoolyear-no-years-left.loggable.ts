import { InternalServerErrorException } from '@nestjs/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class SchoolYearsNoYearsLeft extends InternalServerErrorException implements Loggable {
	// this is a 500, because our development team is responsible to create schoolyears.
	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		/* istanbul ignore next */
		return {
			type: 'SCHOOL_YEARS_NO_YEARS_LEFT',
			message:
				'Could not find any schoolyears with an enddate later than the current date. Check if the next schoolyear has been created in the database.',
			stack: this.stack,
		};
	}
}
