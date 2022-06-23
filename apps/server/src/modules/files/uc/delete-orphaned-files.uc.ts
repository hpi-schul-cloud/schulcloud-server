import { Injectable } from '@nestjs/common';
import { FileRecord, FileRecordParentType, Task } from '@shared/domain';
import { Logger } from '@src/core/logger/logger.service';
import { DeleteOrphanedFilesRepo } from '../repo/delete-orphaned-files.repo';
import { FileFileRecord } from '../types';
import { SyncFilesStorageService } from './sync-files-storage.service';

@Injectable()
export class DeleteOrphanedFilesUc {
	constructor(
		private deleteOrphanedFilesRepo: DeleteOrphanedFilesRepo,
		private logger: Logger,
		private syncFilesStorageService: SyncFilesStorageService
	) {
		this.logger.setContext(DeleteOrphanedFilesUc.name);
	}

	async deleteOrphanedFilesForEntity(parentType: FileRecordParentType) {
		const tasks = await this.deleteOrphanedFilesRepo.findTasks();
		this.logger.log(`Found ${tasks.length} tasks.`);

		const fileRecords = await this.deleteOrphanedFilesRepo.findFilerecords(parentType);
		this.logger.log(`Found ${fileRecords.length} fileRecords.`);

		const fileFileRecords = await this.deleteOrphanedFilesRepo.findAllFilesFilerecords();
		this.logger.log(`Found ${fileFileRecords.length} fileFileRecords.`);

		const orphanedFileRecords = this.getOrphanedFileRecords(tasks, fileRecords, fileFileRecords);
		this.logger.log(`Found ${orphanedFileRecords.length} orphaned fileRecords.`);

		await this.removeOrphans(orphanedFileRecords);
		this.logger.log(`Finished removing orphaned fileRecords.`);
	}

	private getOrphanedFileRecords(
		tasks: Task[],
		fileRecords: FileRecord[],
		fileFileRecords: FileFileRecord[]
	): FileRecord[] {
		return fileRecords.filter((fileRecord) => {
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
	}

	private async removeOrphans(fileRecords: FileRecord[]) {
		const promises = fileRecords.map(async (fileRecord) => {
			await this.removeOrphan(fileRecord);
		});

		await Promise.all(promises);
	}

	private async removeOrphan(fileRecord: FileRecord) {
		try {
			const path = [fileRecord._schoolId.toHexString(), fileRecord.id].join('/');
			await this.syncFilesStorageService.remove(path);
			this.logger.log(`Successfully removed file with path = ${path} from S3 bucket.`);

			await this.removeMetaData(fileRecord);
			this.logger.log(
				`Successfully removed fileRecord with id = ${fileRecord.id} and corresponding fileFileRecord from database.`
			);
		} catch (error) {
			this.logger.error(`Error removing fileRecord with id = ${fileRecord.id}.`);
			this.logger.error(error);
		}
	}

	private async removeMetaData(fileRecord: FileRecord) {
		await this.deleteOrphanedFilesRepo.deleteFileRecord(fileRecord);

		await this.deleteOrphanedFilesRepo.deleteFileFileRecord(fileRecord);
	}
}
