import { ErrorLogMessage, Loggable } from '@core/logger';
import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';

export class SchoolInMigrationLoggableException extends BusinessError implements Loggable {
	constructor() {
		super(
			{
				type: 'SCHOOL_IN_MIGRATION',
				title: 'Login failed because school is in migration',
				defaultMessage: 'Login failed because creation of user is not possible during migration',
			},
			HttpStatus.UNAUTHORIZED
		);
	}

	getLogMessage(): ErrorLogMessage {
		return {
			type: this.type,
			stack: this.stack,
		};
	}
}
