import { UnprocessableEntityException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type School } from '../do';

export class SchoolAlreadyInMaintenanceLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(private readonly school: School) {
		super('School is already in maintenance');
	}

	public getLogMessage(): LoggableMessage {
		const message = {
			type: 'SCHOOL_ALREADY_IN_MAINTENANCE',
			message: this.message,
			stack: this.stack,
			data: {
				schoolId: this.school.id,
			},
		};

		return message;
	}
}
