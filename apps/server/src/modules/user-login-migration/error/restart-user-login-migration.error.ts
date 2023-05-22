import { BusinessError } from '@shared/common';
import { HttpStatus } from '@nestjs/common';

export class RestartUserLoginMigrationError extends BusinessError {
	constructor(message: string, details?: Record<string, unknown>) {
		super(
			{
				type: 'Restart_USER_MIGRATION_FAILED',
				title: 'Restart Migration failed',
				defaultMessage: message || 'Migration of school could not be restarted.',
			},
			HttpStatus.BAD_REQUEST,
			details
		);
	}
}
