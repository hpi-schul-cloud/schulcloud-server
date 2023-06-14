import { BusinessError } from '@shared/common';
import { HttpStatus } from '@nestjs/common';

export class RollbackUserLoginMigrationError extends BusinessError {
	constructor(message: string, details?: Record<string, unknown>) {
		super(
			{
				type: 'ROLLBACK_USER_MIGRATION_FAILED',
				title: 'Rollback Migration failed',
				defaultMessage: message || 'School migration could not be rolled back.',
			},
			HttpStatus.BAD_REQUEST,
			details
		);
	}
}
