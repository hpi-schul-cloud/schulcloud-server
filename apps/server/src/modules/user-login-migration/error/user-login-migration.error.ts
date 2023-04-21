import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';

export class UserLoginMigrationError extends BusinessError {
	constructor(details?: Record<string, unknown>) {
		super(
			{
				type: 'USER_MIGRATION_FAILED',
				title: 'Migration failed',
				defaultMessage: 'Migration of user failed during migration process',
			},
			HttpStatus.INTERNAL_SERVER_ERROR,
			details
		);
	}
}
