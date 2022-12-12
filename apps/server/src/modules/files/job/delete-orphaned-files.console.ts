/* istanbul ignore file */

import { FileRecordParentType } from '@src/modules/files-storage/entity/filerecord.entity';
import { Command, Console } from 'nestjs-console';
import { DeleteOrphanedFilesUc } from '../uc';

// Temporary functionality for migration to new fileservice
// TODO: Remove when BC-1496 is done!
@Console({ command: 'delete-orphaned-files' })
export class DeleteOrphanedFilesConsole {
	constructor(private deleteOrphanedFilesUc: DeleteOrphanedFilesUc) {}

	@Command({ command: 'tasks' })
	async deleteOrphanedFilesForTasks(): Promise<void> {
		await this.deleteOrphanedFilesUc.deleteOrphanedFilesForParentType(FileRecordParentType.Task);
	}

	@Command({ command: 'submissions' })
	async deleteOrphanedFilesForSubmissions(): Promise<void> {
		await this.deleteOrphanedFilesUc.deleteOrphanedFilesForParentType(FileRecordParentType.Submission);
	}

	@Command({ command: 'lessons' })
	async deleteDuplicatedFilesForLessons(): Promise<void> {
		await this.deleteOrphanedFilesUc.deleteDuplicatedFilesForParentType(FileRecordParentType.Lesson);
	}
}
