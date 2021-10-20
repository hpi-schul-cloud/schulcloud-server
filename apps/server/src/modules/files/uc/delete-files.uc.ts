import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger/logger.service';
import { File } from '@shared/domain';
import { FileStorageAdapter } from '@shared/infra/filestorage';
import { FilesRepo } from '../repo';

@Injectable()
export class DeleteFilesUc {
	constructor(private filesRepo: FilesRepo, private fileStorageAdapter: FileStorageAdapter, private logger: Logger) {
		this.logger.setContext(DeleteFilesUc.name);
	}

	/**
	 * Schedules files that have been removed prior removedSince by a user to be removed.
	 * @param removedSince
	 */
	async removeDeletedFilesData(removedSince: Date): Promise<void> {
		const filesForDeletion = await this.filesRepo.findAllFilesForCleanup(removedSince);
		const numberOfFiles = filesForDeletion.length;
		this.logger.log(`${numberOfFiles} files will be deleted`);
		const failingFileIds: string[] = [];
		// eslint-disable-next-line no-restricted-syntax
		for (const file of filesForDeletion) {
			try {
				// eslint-disable-next-line no-await-in-loop
				await this.filesRepo.deleteFile(file);
			} catch (err) {
				failingFileIds.push(file.id);
				this.logger.error(err);
			}
		}
		this.logger.log(`${numberOfFiles - failingFileIds.length} out of ${numberOfFiles} files were successfully deleted`);
		if (failingFileIds.length > 0) {
			this.logger.log('the following files could not be deleted:', failingFileIds);
		}
	}
}
