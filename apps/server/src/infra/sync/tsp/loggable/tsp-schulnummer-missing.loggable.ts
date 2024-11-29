import { Loggable, LogMessage } from '../../../../core/logger';

export class TspSchulnummerMissingLoggable implements Loggable {
	constructor(private readonly schulName?: string) {}

	public getLogMessage(): LogMessage {
		const message: LogMessage = {
			message: `The TSP school '${this.schulName ?? ''}' is missing a Schulnummer. This school is skipped.`,
			data: {
				schulName: this.schulName,
			},
		};

		return message;
	}
}
