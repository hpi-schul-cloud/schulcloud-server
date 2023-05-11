/* eslint-disable no-await-in-loop */
import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger/logger.service';
import { FilesRepo } from '@shared/repo';
import { File } from '@shared/domain';
import { FileStorageAdapter } from '@shared/infra/filestorage';

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
			this.logger.error('the following files could not be deleted:', failingFileIds);
		}
	}

	public async deleteMarkedFiles(removedSince: Date, batchSize: number) {
		let batchCounter = 0;
		let numberOfFilesFound = 0;

		do {
			const [files, count] = await this.filesRepo.findAndCountFilesForCleanup(removedSince, batchSize);

			const promises = files.map((file) => this.deleteFile(file));
			await Promise.all(promises);

			numberOfFilesFound = count;
			batchCounter += 1;
			this.logger.debug(`Finished batch ${batchCounter} with ${numberOfFilesFound} files`);
		} while (numberOfFilesFound > 0);
	}

	private async deleteFile(file: File) {
		if (!file.isDirectory) {
			await this.fileStorageAdapter.deleteFile(file);
		}
		await this.filesRepo.delete(file);

		console.log(file.name + 'deleted');
	}
}
