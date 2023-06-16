import { BusinessError } from '@shared/common';
import { HttpStatus } from '@nestjs/common';
import { ErrorLogMessage, Loggable } from '@src/core/logger';

export class StartUserLoginMigrationError extends BusinessError implements Loggable {
	constructor(
		private readonly description: string,
		private readonly schoolId?: string,
		details?: Record<string, unknown>
	) {
		super(
			{
				type: 'START_USER_MIGRATION_FAILED',
				title: 'Start Migration failed',
				defaultMessage: description || 'Migration of school could not be started.',
			},
			HttpStatus.BAD_REQUEST,
			details
		);
	}

	getLogMessage(): ErrorLogMessage {
		const message = {
			type: 'START_USER_MIGRATION_FAILED',
			message: this.description || 'Migration of school could not be started.',
			schoolId: this.schoolId,
		};
		return message;
	}
}
