import { Injectable } from '@nestjs/common';
import { FileRecordParentType } from '@shared/domain';
import { Logger } from '@src/core/logger/logger.service';
import { DeleteOrphanedFilesRepo } from '../repo/delete-orphaned-files.repo';

@Injectable()
export class DeleteOrphanedFilesUc {
	constructor(private deleteOrphanedFilesRepo: DeleteOrphanedFilesRepo, private logger: Logger) {
		this.logger.setContext(DeleteOrphanedFilesUc.name);
	}

	async deleteOrphanedFilesForEntity(parentType: FileRecordParentType) {
		const tasks = await this.deleteOrphanedFilesRepo.findTasks();
		const fileRecords = await this.deleteOrphanedFilesRepo.findFilerecords(parentType);
		const fileFileRecords = await this.deleteOrphanedFilesRepo.findAllFilesFilerecords();

		const filteredFileRecords = fileRecords.filter((fileRecord) => {
			const task = tasks.find((entity) => entity.id === fileRecord.parentId);

			if (!task) {
				return true;
			}

			const fileId = fileFileRecords.find(
				(fileFileRecord) => fileFileRecord.filerecordId.toHexString() === fileRecord.id
			)?.fileId;

			const isFileIdInTaskFiles = fileId && !task.files.toArray().some((file) => file.id === fileId.toHexString());

			// Fehler werfen wenn fileId = undefined?
			if (isFileIdInTaskFiles) {
				return true;
			}

			return false;
		});

		console.log(filteredFileRecords);
	}
}
