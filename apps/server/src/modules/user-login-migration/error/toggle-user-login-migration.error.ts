import { BusinessError } from '@shared/common';
import { HttpStatus } from '@nestjs/common';

export class ToggleUserLoginMigrationError extends BusinessError {
	constructor(message: string, details?: Record<string, unknown>) {
		super(
			{
				type: 'TOGGLE_USER_MIGRATION_FAILED',
				title: 'Toggling Migration failed',
				defaultMessage: message || 'Migration of school could not be toggled.',
			},
			HttpStatus.BAD_REQUEST,
			details
		);
	}
}
