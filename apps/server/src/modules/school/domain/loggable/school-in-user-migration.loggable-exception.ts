import { UnprocessableEntityException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type School } from '../do';

export class SchoolInUserMigrationLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(private readonly school: School) {
		super('School year change unavailable while in user migration');
	}

	public getLogMessage(): LoggableMessage {
		const message = {
			type: 'SCHOOL_IN_USER_MIGRATION',
			message: this.message,
			stack: this.stack,
			data: {
				schoolId: this.school.id,
			},
		};

		return message;
	}
}
