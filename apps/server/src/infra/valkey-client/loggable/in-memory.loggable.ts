import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class InMemoryLoggable implements Loggable {
	constructor(private readonly message: string) {}

	// istanbul ignore next
	public getLogMessage(): LoggableMessage {
		const log = {
			message: `Attention: InMemoryClient connection - ${this.message}`,
		};

		return log;
	}
}
