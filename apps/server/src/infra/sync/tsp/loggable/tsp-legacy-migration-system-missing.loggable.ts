import { Loggable, LogMessage } from '@src/core/logger';

export class TspLegacyMigrationSystemMissingLoggable implements Loggable {
	getLogMessage(): LogMessage {
		const message: LogMessage = {
			message: 'No legacy system found',
		};

		return message;
	}
}
