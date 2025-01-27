import { Configuration } from '@hpi-schul-cloud/commons';
import util from 'util';
import _ from 'lodash';
import { Loggable } from './interfaces';
import { LogMessageWithContext } from './types';

export class LoggingUtils {
	static createMessageWithContext(loggable: Loggable, context?: string | undefined): LogMessageWithContext {
		const loggableMessage = loggable.getLogMessage();

		if (Configuration.get('JSON_LOG_FORMAT') !== true) {
			return { message: this.stringifyMessage(loggableMessage), context };
		}
		let finalMessage;
		let finalMistratedLoggable: any = loggableMessage;
		if ('message' in loggableMessage) {
			finalMessage = loggableMessage.message;
			const { message, ...loggableMessageWithoutMessage } = loggableMessage;
			finalMistratedLoggable = loggableMessageWithoutMessage;
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		return { message: finalMessage, context: _.merge({}, { name: context }, finalMistratedLoggable) };
	}

	private static stringifyMessage(message: unknown): string {
		const stringifiedMessage = util.inspect(message).replace(/\n/g, '').replace(/\\n/g, '');

		return stringifiedMessage;
	}

	static isInstanceOfLoggable(object: any): object is Loggable {
		return 'getLogMessage' in object;
	}
}
