import { Loggable, LogMessage } from '@infra/logger';

export class InMemoryLoggable implements Loggable {
	constructor(private readonly message: string) {}

	// istanbul ignore next
	public getLogMessage(): LogMessage {
		const log = {
			message: `Attention: InMemoryClient connection - ${this.message}`,
		};

		return log;
	}
}
