import { ILoggable, LogMessage } from '@src/core/logger/interfaces/loggable';

export class AggregationEmptyLoggable implements ILoggable {
	getLogMessage(): LogMessage {
		return {
			message: 'No items found. Nothing to do.',
		};
	}
}
