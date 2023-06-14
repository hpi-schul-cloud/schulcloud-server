import { BusinessError } from '@shared/common';
import { HttpStatus } from '@nestjs/common';

export class RevertUserLoginMigrationError extends BusinessError {
	constructor(message: string, details?: Record<string, unknown>) {
		super(
			{
				type: 'REVERT_USER_MIGRATION_FAILED',
				title: 'Revert Migration failed',
				defaultMessage: message || 'School migration could not be reverted.',
			},
			HttpStatus.BAD_REQUEST,
			details
		);
	}
}
