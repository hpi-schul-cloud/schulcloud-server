/* istanbul ignore file */

import { FileRecordParent } from '@src/modules/files-storage/entity/filerecord.entity';
import { Command, Console } from 'nestjs-console';
import { DeleteOrphanedFilesUc } from '../uc';

// Temporary functionality for migration to new fileservice
// TODO: Remove when BC-1496 is done!
@Console({ command: 'delete-orphaned-files' })
export class DeleteOrphanedFilesConsole {
	constructor(private deleteOrphanedFilesUc: DeleteOrphanedFilesUc) {}

	@Command({ command: 'tasks' })
	async deleteOrphanedFilesForTasks() {
		await this.deleteOrphanedFilesUc.deleteOrphanedFilesForParentType(FileRecordParent.Task);
	}

	@Command({ command: 'lessons' })
	async deleteOrphanedFilesForLessons() {
		await this.deleteOrphanedFilesUc.deleteDuplicatedFilesForParentType(FileRecordParent.Lesson);
	}
}
