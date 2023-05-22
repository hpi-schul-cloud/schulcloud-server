import { Loggable } from './interfaces';
import { LogMessage } from './types';

export class LoggableMessage implements Loggable {
	constructor(private readonly message: string) {}

	getLogMessage(): LogMessage {
		return { message: this.message };
	}
}
