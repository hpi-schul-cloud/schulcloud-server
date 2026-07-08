import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class UserAlreadyMigratedLoggable implements Loggable {
	constructor(private readonly userId: string) {}

	getLogMessage(): LoggableMessage {
		return {
			message: 'The user has migrated already and will be skipped during migration process.',
			data: {
				userId: this.userId,
			},
		};
	}
}
