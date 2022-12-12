import { Loggable } from '@src/core/logger/interfaces/loggable';
import { FileSyncOptions } from '../types';

export class AggregationStartLoggable implements Loggable {
	aggregationsCounter: number;

	fileSyncOptions: FileSyncOptions;

	constructor(aggregationsCounter: number, options: FileSyncOptions) {
		this.aggregationsCounter = aggregationsCounter;
		this.fileSyncOptions = options;
	}

	getLogMessage() {
		return {
			message: `Starting file sync aggregation`,
			data: {
				currentAggregation: this.aggregationsCounter,
				aggregationSize: this.fileSyncOptions.aggregationSize,
				numberOfParallelPromises: this.fileSyncOptions.numParallelPromises,
			},
		};
	}
}
