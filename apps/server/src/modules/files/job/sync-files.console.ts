/* istanbul ignore file */

import { Logger } from '@src/core/logger/logger.service';
import { FileRecordParentType } from '@src/modules/files-storage/entity/filerecord.entity';
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

	@Command({ command: 'submissions [aggregationSize] [numParallelPromises]' })
	async syncFilesForSubmissions(aggregationSize = 5000, numParallelPromises = 50) {
		await this.syncFilesUc.syncFilesForParentType(
			FileRecordParentType.Submission,
			aggregationSize,
			numParallelPromises
		);
	}

	@Command({ command: 'embedded [type] [limit]' })
	async syncEmbeddedFiles(type: AvailableSyncParentType, limit = 1000): Promise<void> {
		if (type !== FileRecordParentType.Lesson && type !== FileRecordParentType.Task) {
			this.logger.log('wrong parent type');
			return;
		}

		await this.syncEmbeddedFilesUc.syncFilesForParentType(type, Number(limit));
	}
}
