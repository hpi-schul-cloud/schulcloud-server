import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class ConnectedLoggable implements Loggable {
	constructor(private readonly message: unknown) {}

	// istanbul ignore next
	public getLogMessage(): LoggableMessage {
		const log = {
			message: this.message === undefined ? 'Connected to Valkey' : JSON.stringify(this.message),
		};

		return log;
	}
}
