import { Loggable, LoggableMessage } from '@shared/common/loggable/index';

export class GenericErrorLoggable implements Loggable {
	constructor(private readonly error: unknown) {}

	getLogMessage(): LoggableMessage {
		if (this.error instanceof Error) {
			return {
				message: this.error.message,
				stack: this.error.stack,
			};
		}
		return {
			message: String(this.error),
			stack: undefined,
		};
	}
}
