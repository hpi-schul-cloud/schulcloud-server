import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

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

	public getLogMessage(): LoggableMessage {
		return {
			type: this.type,
			stack: this.stack,
		};
	}
}
