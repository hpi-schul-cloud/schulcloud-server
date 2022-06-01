import { Logger } from '@src/core/logger';
import { Command, Console } from 'nestjs-console';
import { SyncFilesUc } from '../uc/sync-files.uc';

@Console({ command: 'sync-files' })
export class SyncFilesConsole {
	constructor(private syncFilesUc: SyncFilesUc, private logger: Logger) {}

	@Command({ command: 'tasks [batchSize]' })
	async syncFilesForTasks(batchSize = 50) {
		await this.syncFilesUc.syncFilesForTasks(batchSize);
	}
}
