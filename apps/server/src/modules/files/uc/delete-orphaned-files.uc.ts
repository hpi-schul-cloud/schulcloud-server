import { Injectable } from '@nestjs/common';
import { FileRecordParentType } from '@shared/domain';
import { FileRecordRepo } from '@shared/repo';
import { Logger } from '@src/core/logger/logger.service';
import { DeleteOrphanedFilesRepo } from '../repo/delete-orphaned-files.repo';

@Injectable()
export class DeleteOrphanedFilesUc {
	constructor(
		private deleteOrphanedFilesRepo: DeleteOrphanedFilesRepo,
		private fileRecordRepo: FileRecordRepo,
		private logger: Logger
	) {
		this.logger.setContext(DeleteOrphanedFilesUc.name);
	}

	async deleteOrphanedFilesForEntity(parentType: FileRecordParentType) {
		const tasks = await this.deleteOrphanedFilesRepo.findTasks();
		const fileRecords = await this.fileRecordRepo.findByParentType(parentType);
		const fileFileRecords = await this.deleteOrphanedFilesRepo.findAllFilesFilerecords();

		const filteredFileRecords = fileRecords.filter((fileRecord) => {
			const parentId = fileRecord._parentId.toHexString();
			const task = tasks.find((entity) => entity.id === parentId);

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
