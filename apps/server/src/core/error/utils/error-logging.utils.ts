import { ILoggable } from '@src/core/logger/interfaces/loggable';
import { LoggingUtils } from '@src/core/logger/logging.utils';
import util from 'util';
import { ErrorLoggable } from '../error.loggable';

export class ErrorLoggingUtils {
	static createErrorLoggable(error: unknown): ILoggable {
		let loggable: ILoggable;

		if (LoggingUtils.isInstanceOfLoggable(error)) {
			loggable = error;
		} else if (error instanceof Error) {
			loggable = new ErrorLoggable(error);
		} else {
			const unknownError = new Error(util.inspect(error));
			loggable = new ErrorLoggable(unknownError);
		}

		return loggable;
	}
}
