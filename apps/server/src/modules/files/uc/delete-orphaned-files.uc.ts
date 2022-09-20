/* istanbul ignore file */

import { Injectable } from '@nestjs/common';
import { FileRecord, FileRecordParentType } from '@shared/domain';
import { Logger } from '@src/core/logger/logger.service';
import { OrphanedFilesRepo } from '../repo/orphaned-files.repo';
import { SyncFilesStorageService } from './sync-files-storage.service';

@Injectable()
export class DeleteOrphanedFilesUc {
	constructor(
		private orphanedFilesRepo: OrphanedFilesRepo,
		private syncFilesStorageService: SyncFilesStorageService,
		private logger: Logger
	) {
		this.logger.setContext(DeleteOrphanedFilesUc.name);
	}

	async deleteOrphanedFilesForParentType(parentType: FileRecordParentType) {
		this.logger.log('Start deletion process.');

		const orphanedFileRecords = await this.orphanedFilesRepo.findOrphanedFileRecords(parentType);
		this.logger.log(`Found ${orphanedFileRecords.length} orphaned fileRecords.`);

		await this.deleteOrphans(orphanedFileRecords);
		this.logger.log(`Finished removing orphaned fileRecords.`);
	}

	async deleteDuplicatedFilesForParentType(parentType: FileRecordParentType) {
		this.logger.log('Start deletion process.');

		const orphanedFileRecords = await this.orphanedFilesRepo.findDuplicatedFileRecords(parentType);
		this.logger.log(`Found ${orphanedFileRecords.length} orphaned fileRecords.`);
		await this.deleteOrphans(orphanedFileRecords);
		this.logger.log(`Finished removing orphaned fileRecords.`);
	}

	private async deleteOrphans(fileRecords: FileRecord[]) {
		const promises = fileRecords.map(async (fileRecord) => {
			await this.deleteOrphan(fileRecord);
		});

		await Promise.all(promises);
	}

	private async deleteOrphan(fileRecord: FileRecord) {
		try {
			const path = [fileRecord.schoolId, fileRecord.id].join('/');
			await this.syncFilesStorageService.removeFile(path);
			this.logger.log(`Successfully removed file with path = ${path} from S3 bucket.`);

			await this.deleteMetaData(fileRecord);
			this.logger.log(
				`Successfully removed fileRecord with id = ${fileRecord.id} and corresponding fileFileRecord from database.`
			);
		} catch (error) {
			this.logger.error(`Error removing fileRecord with id = ${fileRecord.id}.`);
			this.logger.error(error);
		}
	}

	private async deleteMetaData(fileRecord: FileRecord) {
		await Promise.all([
			this.orphanedFilesRepo.deleteFileRecord(fileRecord),
			this.orphanedFilesRepo.deleteFileFileRecord(fileRecord),
		]);
	}
}
