import { Logger } from '@src/core/logger';
import { Command, Console } from 'nestjs-console';
import { SyncFilesUc } from '../uc/sync-files.uc';

@Console({ command: 'sync-filerecords' })
export class SyncFilerecordsConsole {
	constructor(private syncFilesUc: SyncFilesUc, private logger: Logger) {}

	@Command({ command: 'tasks [batchSize]' })
	async syncFilerecordsForTasks(batchSize = 50) {
		await this.syncFilesUc.syncFilerecordsForTasks(batchSize);
	}
}
