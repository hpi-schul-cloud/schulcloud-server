/* istanbul ignore file */

import { Logger } from '@src/core/logger/logger.service';
import { FileRecordParent } from '@src/modules/files-storage/entity/filerecord.entity';
import { Command, Console } from 'nestjs-console';
import { AvailableSyncParentType } from '../types';
import { SyncEmbeddedFilesUc } from '../uc/sync-embedded-files.uc';
import { SyncFilesUc } from '../uc/sync-files.uc';

// Temporary functionality for migration to new fileservice
// TODO: Remove when BC-1496 is done!
@Console({ command: 'sync-files' })
export class SyncFilesConsole {
	constructor(
		private readonly syncFilesUc: SyncFilesUc,
		private readonly syncEmbeddedFilesUc: SyncEmbeddedFilesUc,
		private logger: Logger
	) {}

	@Command({ command: 'tasks [aggregationSize] [numParallelPromises]' })
	async syncFilesForTasks(aggregationSize = 5000, numParallelPromises = 50) {
		await this.syncFilesUc.syncFilesForParentType(FileRecordParent.Task, aggregationSize, numParallelPromises);
	}

	@Command({ command: 'embedded [type] [limit]' })
	async syncEmbeddedFiles(type: AvailableSyncParentType, limit = 1000): Promise<void> {
		if (type !== FileRecordParent.Lesson && type !== FileRecordParent.Task) {
			this.logger.log('wrong parent type');
			return;
		}

		await this.syncEmbeddedFilesUc.syncFilesForParentType(type, Number(limit));
	}
}
