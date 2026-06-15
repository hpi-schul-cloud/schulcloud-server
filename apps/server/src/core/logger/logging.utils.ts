import util from 'util';
import { Loggable } from './interfaces';
import { LogMessageWithContext } from './types';

export class LoggingUtils {
	public static createMessageWithContext(loggable: Loggable, context?: string): LogMessageWithContext {
		const message = loggable.getLogMessage();
		const stringifiedMessage = this.stringifyMessage(message);
		const messageWithContext = { message: stringifiedMessage, context };

		return messageWithContext;
	}

	private static stringifyMessage(message: unknown): string {
		const stringifiedMessage = util.inspect(message).replace(/\n/g, '').replace(/\\n/g, '');

		return stringifiedMessage;
	}

	public static isInstanceOfLoggable(object: unknown): object is Loggable {
		if (typeof object !== 'object' || object === null) {
			return false;
		}
		return 'getLogMessage' in object;
	}
}
