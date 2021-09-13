import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger/logger.service';
import { File } from '../entity';
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
		console.log('foo');
		const filesForDeletion = await this.filesRepo.getExpiredFiles(removedSince);
		for (const file of filesForDeletion) {
			this.fileStorageRepo.deleteFile(file);
		};
	}
}
