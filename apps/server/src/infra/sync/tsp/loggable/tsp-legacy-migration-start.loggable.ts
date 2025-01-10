import { Loggable, LogMessage } from '@src/core/logger';

export class TspLegacyMigrationStartLoggable implements Loggable {
	public getLogMessage(): LogMessage {
		const message: LogMessage = {
			message: 'Running migration of legacy tsp data.',
		};

		return message;
	}
}
