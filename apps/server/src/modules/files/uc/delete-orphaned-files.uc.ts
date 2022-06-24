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
		this.logger.log('Start deletion process.');

		const orphanedFileRecords = await this.deleteOrphanedFilesRepo.findOrphanedFileRecords();
		this.logger.log(`Found ${orphanedFileRecords.length} orphaned fileRecords.`);

		await this.removeOrphans(orphanedFileRecords);
		this.logger.log(`Finished removing orphaned fileRecords.`);
	}

	private async removeOrphans(fileRecords: FileRecord[]) {
		const promises = fileRecords.map(async (fileRecord) => {
			await this.removeOrphan(fileRecord);
		});

		await Promise.all(promises);
	}

	private async removeOrphan(fileRecord: FileRecord) {
		try {
			const path = [fileRecord.schoolId, fileRecord.id].join('/');
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
