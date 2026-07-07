import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class SchoolNumberMismatchLoggableException extends BusinessError implements Loggable {
	constructor(
		private readonly sourceSchoolNumber: string,
		private readonly targetSchoolNumber: string
	) {
		super(
			{
				type: 'SCHOOL_MIGRATION_FAILED',
				title: 'Migration of school failed.',
				defaultMessage: 'School could not migrate during user migration process.',
			},
			HttpStatus.INTERNAL_SERVER_ERROR,
			{
				sourceSchoolNumber,
				targetSchoolNumber,
			}
		);
	}

	getLogMessage(): LoggableMessage {
		return {
			type: this.type,
			message: this.message,
			stack: this.stack,
			data: {
				sourceSchoolNumber: this.sourceSchoolNumber,
				targetSchoolNumber: this.targetSchoolNumber,
			},
		};
	}
}
