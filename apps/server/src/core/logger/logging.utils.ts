import util from 'util';
import { Loggable } from './interfaces/loggable';

export class LoggingUtils {
	static createMessage(loggable: Loggable) {
		const message = loggable.getLogMessage();
		const stringifiedMessage = this.stringifyMessage(message);
		return stringifiedMessage;
	}

	static stringifyMessage(message: unknown) {
		const stringifiedMessage = util.inspect(message).replace(/\n/g, '').replace(/\\n/g, '');
		return stringifiedMessage;
	}
}
