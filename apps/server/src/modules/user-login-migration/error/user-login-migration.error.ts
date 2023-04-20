import { BusinessError } from '@shared/common';
import { HttpStatus } from '@nestjs/common';

export class UserLoginMigrationError extends BusinessError {
	constructor(details?: Record<string, unknown>) {
		super(
			{
				type: 'USER_IN_MIGRATION',
				title: 'Migration failed',
				defaultMessage: 'Migration of user failed during migration process',
			},
			HttpStatus.INTERNAL_SERVER_ERROR,
			details
		);
	}
}
