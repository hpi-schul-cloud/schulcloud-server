/* istanbul ignore file */

import { FileRecordParentType } from '@shared/domain';
import { Command, Console } from 'nestjs-console';
import { SyncEmbeddedFilesUc } from '../uc/sync-embedded-files.uc';
import { SyncFilesUc } from '../uc/sync-files.uc';

// Temporary functionality for migration to new fileservice
// TODO: Remove when BC-1496 is done!
@Console({ command: 'sync-files' })
export class SyncFilesConsole {
	constructor(private readonly syncFilesUc: SyncFilesUc, private readonly syncEmbeddedFilesUc: SyncEmbeddedFilesUc) {}

	@Command({ command: 'tasks [aggregationSize] [numParallelPromises]' })
	async syncFilesForTasks(aggregationSize = 5000, numParallelPromises = 50) {
		await this.syncFilesUc.syncFilesForParentType(FileRecordParentType.Task, aggregationSize, numParallelPromises);
	}

	@Command({ command: 'lessons-embedded' })
	async syncFilesForLessons() {
		await this.syncEmbeddedFilesUc.syncEmbeddedFilesForLesson();
	}

	@Command({ command: 'tasks-embedded' })
	async syncFilesForTask() {
		await this.syncEmbeddedFilesUc.syncEmbeddedFilesForTasks();
	}
}
