import { Loggable, LogMessage } from '../../../../core/logger';

export class TspLegacyMigrationStartLoggable implements Loggable {
	getLogMessage(): LogMessage {
		const message: LogMessage = {
			message: 'Running migration of legacy tsp data.',
		};

		return message;
	}
}
