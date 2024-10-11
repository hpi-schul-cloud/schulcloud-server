import { Loggable, LogMessage } from '@src/core/logger';

export class TspSchulnummerMissingLoggable implements Loggable {
	getLogMessage(): LogMessage {
		const message: LogMessage = {
			message: `A TSP school is missing a Schulnummer. Skipping school.`,
		};

		return message;
	}
}
