import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';

export class SchoolInMigrationError extends BusinessError {
	constructor(details?: Record<string, unknown>) {
		super(
			{
				type: 'SCHOOL_IN_MIGRATION',
				title: 'Login failed because school is in migration',
				defaultMessage: 'Login failed because creation of user is not possible during migration',
			},
			HttpStatus.UNAUTHORIZED,
			details
		);
	}
}
