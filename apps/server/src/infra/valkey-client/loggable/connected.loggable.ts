import { Loggable, LogMessage } from '@infra/logger';

export class ConnectedLoggable implements Loggable {
	constructor(private readonly message: unknown) {}

	// istanbul ignore next
	public getLogMessage(): LogMessage {
		const log = {
			message: JSON.stringify(this.message),
		};

		return log;
	}
}
