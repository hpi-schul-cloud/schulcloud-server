import { BusinessError } from '@shared/common';
import { HttpStatus } from '@nestjs/common';

export class UserMigrationError extends BusinessError {
	constructor(details?: Record<string, unknown>) {
		super(
			{
				type: 'USER_IN_MIGRATION',
				title: 'Migration of user failed',
				defaultMessage: 'Migration failed because user transfer is not possible during migration',
			},
			HttpStatus.INTERNAL_SERVER_ERROR,
			details
		);
	}
}
