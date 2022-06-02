import { Logger } from '@src/core/logger';
import { Command, Console } from 'nestjs-console';
import { SyncFilesUc } from '../uc/sync-files.uc';

@Console({ command: 'sync-files' })
export class SyncFilesConsole {
	constructor(private syncFilesUc: SyncFilesUc, private logger: Logger) {}

	@Command({ command: 'tasks [aggregationSize] [batchSize]' })
	async syncFilesForTasks(aggregationSize = 5000, batchSize = 50) {
		let itemsFound: number;
		do {
			this.logger.log(`Starting file sync with aggregationSize = ${aggregationSize} and batchSize = ${batchSize}`);
			// eslint-disable-next-line no-await-in-loop
			itemsFound = await this.syncFilesUc.syncFilesForTasks(aggregationSize, batchSize);
		} while (itemsFound > 0);
	}
}
