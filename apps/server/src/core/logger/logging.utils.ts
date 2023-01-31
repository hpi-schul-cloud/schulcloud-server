import util from 'util';
import { LogMessageWithContext } from './interfaces';
import { ILoggable } from './interfaces/loggable.interface';

export class LoggingUtils {
	static createMessage(loggable: ILoggable, context?: string | undefined): LogMessageWithContext {
		const message = loggable.getLogMessage();
		const stringifiedMessage = this.stringifyMessage(message);
		const messageWithContext = { message: stringifiedMessage, context };
		return messageWithContext;
	}

	private static stringifyMessage(message: unknown): string {
		const stringifiedMessage = util.inspect(message).replace(/\n/g, '').replace(/\\n/g, '');
		return stringifiedMessage;
	}

	static isInstanceOfLoggable(object: any): object is ILoggable {
		return 'getLogMessage' in object;
	}
}
