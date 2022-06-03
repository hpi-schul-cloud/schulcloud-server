import { Logger } from '@src/core/logger';
import { Command, Console } from 'nestjs-console';
import { SyncFilesUc } from '../uc/sync-files.uc';

@Console({ command: 'sync-files' })
export class SyncFilesConsole {
	constructor(private syncFilesUc: SyncFilesUc, private logger: Logger) {}

	@Command({ command: 'tasks [aggregationSize] [batchSize]' })
	async syncFilesForTasks(aggregationSize = 5000, batchSize = 50) {
		let itemsFound: number;
		let aggregationsCounter = 1;

		do {
			this.logger.log(
				`Starting file sync #${aggregationsCounter} with aggregationSize = ${aggregationSize} and batchSize = ${batchSize}`
			);
			// eslint-disable-next-line no-await-in-loop
			itemsFound = await this.syncFilesUc.syncFilesForTasks({ aggregationSize, batchSize, aggregationsCounter });
			aggregationsCounter += 1;
		} while (itemsFound > 0);
	}
}
