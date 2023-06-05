import { BusinessError } from '@shared/common';
import { HttpStatus } from '@nestjs/common';

export class ModifyUserLoginMigrationError extends BusinessError {
	constructor(message?: string, details?: Record<string, unknown>, title?: string) {
		super(
			{
				type: 'MODIFY_USER_MIGRATION_FAILED',
				title: title || 'Modify Migration failed',
				defaultMessage: message || 'Migration of school could not be started.',
			},
			HttpStatus.BAD_REQUEST,
			details
		);
	}
}
