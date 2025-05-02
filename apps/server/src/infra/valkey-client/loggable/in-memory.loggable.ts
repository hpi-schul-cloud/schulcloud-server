import { Loggable } from '@core/logger/interfaces';
import { LogMessage } from '@core/logger/types';

export class InMemoryLoggable implements Loggable {
	constructor(private readonly message: string) {}

	public getLogMessage(): LogMessage {
		const log = {
			message: `Attention: InMemoryClient connection - ${this.message}`,
		};

		return log;
	}
}
