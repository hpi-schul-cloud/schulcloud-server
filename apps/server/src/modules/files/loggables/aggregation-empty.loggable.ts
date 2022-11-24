import { Loggable, LogMessage } from '@src/core/logger/interfaces/loggable';

export class AggregationEmptyLoggable implements Loggable {
	getLogMessage(): LogMessage {
		return {
			message: 'No items found. Nothing to do.',
		};
	}
}
