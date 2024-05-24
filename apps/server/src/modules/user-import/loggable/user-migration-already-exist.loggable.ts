import { User } from '@shared/domain/entity';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class UserAlreadyExistLoggable implements Loggable {
	constructor(private readonly user: User) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'The user has migrated already and will be skipped during migration process',
			data: {
				userId: this.user.id,
			},
		};
	}
}
