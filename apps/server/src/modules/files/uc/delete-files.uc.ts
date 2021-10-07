import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger/logger.service';
import { File } from '@shared/domain';
import { FilesRepo, FileStorageRepo } from '../repo';

@Injectable()
export class DeleteFilesUc {
	constructor(private filesRepo: FilesRepo, private fileStorageRepo: FileStorageRepo, private logger: Logger) {
		this.logger.setContext(DeleteFilesUc.name);
	}

	/**
	 * Schedules files that have been removed prior removedSince by a user to be removed.
	 * @param removedSince
	 */
	async removeDeletedFilesData(removedSince: Date): Promise<void> {
		const filesForDeletion = await this.filesRepo.getExpiredFiles(removedSince);
		// eslint-disable-next-line no-restricted-syntax
		for (const file of filesForDeletion) {
			try {
				// eslint-disable-next-line no-await-in-loop
				if (!file.isDirectory) await this.fileStorageRepo.deleteFile(file as File);
				// eslint-disable-next-line no-await-in-loop
				await this.filesRepo.deleteFile(file);
			} catch (err) {
				this.logger.error(err);
			}
		}
	}
}
