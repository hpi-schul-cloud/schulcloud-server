import { Loggable } from '@src/core/logger/interfaces/loggable';

export class AggregationEmptyLoggable implements Loggable {
	getLogMessage(): unknown {
		return {
			message: 'No items found. Nothing to do.',
		};
	}
}
