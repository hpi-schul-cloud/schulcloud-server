import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';

export class SchoolMigrationError extends BusinessError {
	constructor(details?: Record<string, unknown>, cause?: unknown) {
		super(
			{
				type: 'SCHOOL_MIGRATION_FAILED',
				title: 'Migration of school failed.',
				defaultMessage: 'School could not migrate during user migration process.',
			},
			HttpStatus.INTERNAL_SERVER_ERROR,
			details,
			cause
		);
	}
}
