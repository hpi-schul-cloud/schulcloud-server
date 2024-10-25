import { Loggable, LogMessage } from '@src/core/logger';

export class TspUsersMigratedLoggable implements Loggable {
	constructor(private readonly migratedUsers: number) {}

	getLogMessage(): LogMessage {
		const message: LogMessage = {
			message: `Migrated users: ${this.migratedUsers} users migrated`,
			data: {
				migratedUsers: this.migratedUsers,
			},
		};

		return message;
	}
}
