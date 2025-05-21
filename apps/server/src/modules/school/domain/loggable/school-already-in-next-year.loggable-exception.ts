import { ErrorLogMessage, Loggable } from '@core/logger';
import { UnprocessableEntityException } from '@nestjs/common';
import { School } from '../do';

export class SchoolAlreadyInNextYearLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(private readonly school: School) {
		super('School already in next year');
	}

	public getLogMessage(): ErrorLogMessage {
		const message = {
			type: 'SCHOOL_ALREADY_IN_NEXT_YEAR',
			message: this.message,
			stack: this.stack,
			data: {
				schoolId: this.school.id,
				schoolYear: this.school.currentYear?.name,
			},
		};

		return message;
	}
}
