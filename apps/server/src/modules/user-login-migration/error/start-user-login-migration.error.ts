import { BusinessError } from '@shared/common';
import { HttpStatus } from '@nestjs/common';

export class StartUserLoginMigrationError extends BusinessError {
	constructor(message: string, details?: Record<string, unknown>) {
		super(
			{
				type: 'START_USER_MIGRATION_FAILED',
				title: 'Start Migration failed',
				defaultMessage: message || 'Migration of user failed during migration process',
			},
			HttpStatus.FORBIDDEN,
			details
		);
	}
}
