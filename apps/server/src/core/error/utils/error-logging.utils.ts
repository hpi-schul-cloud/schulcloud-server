import { Loggable } from '@src/core/logger/interfaces/loggable.interface';
import { LoggingUtils } from '@src/core/logger/logging.utils';
import util from 'util';
import { ErrorLoggable } from '../error.loggable';

export class ErrorLoggingUtils {
	static createErrorLoggable(error: unknown): Loggable {
		let loggable: Loggable;

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
