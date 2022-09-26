/* istanbul ignore file */

import { FileRecordParentType } from '@shared/domain';
import { Command, Console } from 'nestjs-console';
import { DeleteOrphanedFilesUc } from '../uc';

// Temporary functionality for migration to new fileservice
// TODO: Remove when BC-1496 is done!
@Console({ command: 'delete-orphaned-files' })
export class DeleteOrphanedFilesConsole {
	constructor(private deleteOrphanedFilesUc: DeleteOrphanedFilesUc) {}

	@Command({ command: 'tasks' })
	async deleteOrphanedFilesForTasks() {
		await this.deleteOrphanedFilesUc.deleteOrphanedFilesForParentType(FileRecordParentType.Task);
	}

	@Command({ command: 'lessons' })
	async deleteOrphanedFilesForLessons() {
		await this.deleteOrphanedFilesUc.deleteDuplicatedFilesForParentType(FileRecordParentType.Lesson);
	}
}
