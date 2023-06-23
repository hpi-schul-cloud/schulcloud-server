import { BadRequestException } from '@nestjs/common';
import { ErrorLogMessage, Loggable } from '@src/core/logger';

export class UserLoginMigrationLoggableException extends BadRequestException implements Loggable {
	constructor(
		private readonly description: string,
		private readonly schoolId?: string,
		private readonly finishedAt?: Date
	) {
		super({
			type: 'START_USER_MIGRATION_FAILED',
			title: 'Start Migration failed',
			defaultMessage: description || 'Migration of school could not be started.',
		});
	}

	getLogMessage(): ErrorLogMessage {
		const message = {
			type: 'START_USER_MIGRATION_FAILED',
			message: this.description || 'Migration of school could not be started.',
			schoolId: this.schoolId,
			startedAt: this.finishedAt,
		};
		return message;
	}
}
