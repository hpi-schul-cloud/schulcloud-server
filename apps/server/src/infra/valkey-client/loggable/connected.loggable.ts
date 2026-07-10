import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class ConnectedLoggable implements Loggable {
	constructor(private readonly message: unknown) {}

	// istanbul ignore next
	public getLogMessage(): LoggableMessage {
		const log = {
			message: JSON.stringify(this.message),
		};

		return log;
	}
}
