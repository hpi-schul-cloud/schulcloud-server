/* istanbul ignore file */

import { Logger } from '@src/core/logger';
import { Command, Console } from 'nestjs-console';
import { FileSyncOptions } from '../types';
import { SyncFilesUc } from '../uc/sync-files.uc';

@Console({ command: 'sync-files' })
export class SyncFilesConsole {
	constructor(private syncFilesUc: SyncFilesUc, private logger: Logger) {
		this.logger.setContext(SyncFilesConsole.name);
	}

	private logStartingAggregation(aggregationsCounter: number, options: FileSyncOptions) {
		this.logger.log(
			`Starting file sync: aggregation #${aggregationsCounter + 1} with aggregationSize = ${
				options.aggregationSize
			} and numParallelPromises = ${options.numParallelPromises}`
		);
	}

	@Command({ command: 'tasks [aggregationSize] [numParallelPromises]' })
	async syncFilesForTasks(aggregationSize = 5000, numParallelPromises = 50) {
		let itemsFound: number;
		let aggregationsCounter = 0;
		const options = new FileSyncOptions(aggregationSize, numParallelPromises);

		do {
			this.logStartingAggregation(aggregationsCounter, options);
			const context = { fileCounter: aggregationsCounter * Number(aggregationSize) };
			// eslint-disable-next-line no-await-in-loop
			itemsFound = await this.syncFilesUc.syncFilesForTasks(options, context);

			aggregationsCounter += 1;
		} while (itemsFound > 0);
	}
}
