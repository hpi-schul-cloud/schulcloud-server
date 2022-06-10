import { Logger } from '@src/core/logger';
import { Command, Console } from 'nestjs-console';
import { SyncFilesUc } from '../uc/sync-files.uc';

@Console({ command: 'sync-files' })
export class SyncFilesConsole {
	constructor(private syncFilesUc: SyncFilesUc, private logger: Logger) {
		this.logger.setContext(SyncFilesConsole.name);
	}

	@Command({ command: 'tasks [aggregationSize] [numParallelPromises]' })
	async syncFilesForTasks(aggregationSize = 5000, numParallelPromises = 50) {
		let itemsFound: number;
		let aggregationsCounter = 0;

		do {
			this.logger.log(
				`Starting file sync: aggregation #${
					aggregationsCounter + 1
				} with aggregationSize = ${aggregationSize} and numParallelPromises = ${numParallelPromises}`
			);
			// eslint-disable-next-line no-await-in-loop
			itemsFound = await this.syncFilesUc.syncFilesForTasks(
				{
					aggregationSize: Number(aggregationSize),
					numParallelPromises: Number(numParallelPromises),
				},
				{ fileCounter: aggregationsCounter * Number(aggregationSize) }
			);
			aggregationsCounter += 1;
		} while (itemsFound > 0);
	}
}
