import { Configuration } from '@hpi-schul-cloud/commons';
import util from 'util';
import { Loggable } from './interfaces';
import { LogMessageWithContext } from './types';

export class LoggingUtils {
	static createMessageWithContext(loggable: Loggable, context?: string | undefined): LogMessageWithContext {
		const message = loggable.getLogMessage();

		if (Configuration.get('JSON_LOG_FORMAT') !== true) {
			return { message: this.stringifyMessage(message), context };
		}
		return { message, context };
	}

	private static stringifyMessage(message: unknown): string {
		const stringifiedMessage = util.inspect(message).replace(/\n/g, '').replace(/\\n/g, '');

		return stringifiedMessage;
	}

	static isInstanceOfLoggable(object: any): object is Loggable {
		return 'getLogMessage' in object;
	}
}
