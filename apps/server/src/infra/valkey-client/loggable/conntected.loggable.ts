import { Loggable } from '@core/logger/interfaces';
import { LogMessage } from '@core/logger/types';

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
