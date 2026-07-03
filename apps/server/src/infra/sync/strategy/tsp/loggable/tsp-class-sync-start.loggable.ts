import { Loggable, LogMessage } from '@infra/logger';

export class TspClassSyncStartLoggable implements Loggable {
	constructor(private readonly count: number) {}

	public getLogMessage(): LogMessage {
		const message: LogMessage = {
			message: `Syncing ${this.count} classes.`,
			data: {
				count: this.count,
			},
		};

		return message;
	}
}
