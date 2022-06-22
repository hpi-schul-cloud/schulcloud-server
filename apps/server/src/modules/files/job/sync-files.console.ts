/* istanbul ignore file */

import { FileRecordParentType } from '@shared/domain';
import { Command, Console } from 'nestjs-console';
import { SyncFilesUc } from '../uc/sync-files.uc';

// Temporary functionality for migration to new fileservice
// TODO: Remove when BC-1496 is done!
@Console({ command: 'sync-files' })
export class SyncFilesConsole {
	constructor(private syncFilesUc: SyncFilesUc) {}

	@Command({ command: 'tasks [aggregationSize] [numParallelPromises]' })
	async syncFilesForTasks(aggregationSize = 5000, numParallelPromises = 50) {
		await this.syncFilesUc.syncFilesForParentType(FileRecordParentType.Task, aggregationSize, numParallelPromises);
	}
}
