import { BusinessError } from '@shared/common';
import { HttpStatus } from '@nestjs/common';

export class SchoolMigrationError extends BusinessError {
	constructor(details?: Record<string, unknown>) {
		super(
			{
				type: 'SCHOOL_MIGRATION_FAILED',
				title: 'Migration of school failed.',
				defaultMessage: 'School could not migrate during user migration process.',
			},
			HttpStatus.INTERNAL_SERVER_ERROR,
			details
		);
	}
}
