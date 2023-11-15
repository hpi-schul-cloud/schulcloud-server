import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class SchoolNumberMismatchLoggableException extends BusinessError implements Loggable {
	constructor(private readonly sourceSchoolNumber: string, private readonly targetSchoolNumber: string) {
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

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
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
