import { DeleteObjectOutput } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { FileRecord, FileRecordParentType, Task } from '@shared/domain';
import { FileRecordRepo } from '@shared/repo';
import { Logger } from '@src/core/logger/logger.service';
import { DeleteOrphanedFilesRepo } from '../repo/delete-orphaned-files.repo';
import { FileFileRecord } from '../types';
import { SyncFilesStorageService } from './sync-files-storage.service';

@Injectable()
export class DeleteOrphanedFilesUc {
	constructor(
		private deleteOrphanedFilesRepo: DeleteOrphanedFilesRepo,
		private fileRecordRepo: FileRecordRepo,
		private logger: Logger,
		private syncFilesStorageService: SyncFilesStorageService
	) {
		this.logger.setContext(DeleteOrphanedFilesUc.name);
	}

	async deleteOrphanedFilesForEntity(parentType: FileRecordParentType) {
		const tasks = await this.deleteOrphanedFilesRepo.findTasks();
		const fileRecords = await this.deleteOrphanedFilesRepo.findFilerecords(parentType);
		const fileFileRecords = await this.deleteOrphanedFilesRepo.findAllFilesFilerecords();

		const orphanedFileRecords = this.getOrphanedFileRecords(tasks, fileRecords, fileFileRecords);

		await this.removeS3Files(orphanedFileRecords);

		await this.removeMetaData(orphanedFileRecords);

		console.log(orphanedFileRecords);
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

	private async removeS3Files(fileRecords: FileRecord[]): Promise<DeleteObjectOutput> {
		const paths = fileRecords.map((fileRecord) => {
			return [fileRecord._schoolId.toHexString(), fileRecord.id].join('/');
		});

		const deleteObjectOutput = await this.syncFilesStorageService.remove(paths);

		return deleteObjectOutput;
	}

	private async removeMetaData(fileRecords: FileRecord[]) {
		await this.fileRecordRepo.delete(fileRecords);
	}
}
