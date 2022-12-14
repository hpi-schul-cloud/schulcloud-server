import util from 'util';
import { ILoggable } from './interfaces/loggable';

export class LoggingUtils {
	static createMessage(loggable: ILoggable) {
		const message = loggable.getLogMessage();
		const stringifiedMessage = this.stringifyMessage(message);
		return stringifiedMessage;
	}

	static stringifyMessage(message: unknown) {
		const stringifiedMessage = util.inspect(message).replace(/\n/g, '').replace(/\\n/g, '');
		return stringifiedMessage;
	}
}
