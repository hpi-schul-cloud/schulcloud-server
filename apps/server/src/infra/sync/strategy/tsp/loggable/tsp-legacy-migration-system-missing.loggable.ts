import { Loggable, LogMessage } from '@core/logger';

export class TspLegacyMigrationSystemMissingLoggable implements Loggable {
	public getLogMessage(): LogMessage {
		const message: LogMessage = {
			message: 'No legacy system found',
		};

		return message;
	}
}
