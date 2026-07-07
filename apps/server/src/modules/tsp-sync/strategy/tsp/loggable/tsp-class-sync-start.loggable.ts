import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class TspClassSyncStartLoggable implements Loggable {
	constructor(private readonly count: number) {}

	public getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			message: `Syncing ${this.count} classes.`,
			data: {
				count: this.count,
			},
		};

		return message;
	}
}
