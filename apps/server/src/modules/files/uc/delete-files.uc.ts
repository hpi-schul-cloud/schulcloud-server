/* eslint-disable no-await-in-loop */
import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger/logger.service';
import { FilesRepo } from '@shared/repo';
import { File } from '@shared/domain';
import { FileStorageAdapter } from '@shared/infra/filestorage';

@Injectable()
export class DeleteFilesUc {
	constructor(
		private readonly filesRepo: FilesRepo,
		private readonly fileStorageAdapter: FileStorageAdapter,
		private readonly logger: Logger
	) {
		this.logger.setContext(DeleteFilesUc.name);
	}

	public async deleteMarkedFiles(deletedSince: Date, batchSize: number): Promise<void> {
		let batchCounter = 0;
		let numberOfFilesInBatch = 0;
		let numberOfProcessedFiles = 0;
		const failingFileIds: string[] = [];

		do {
			const offset = failingFileIds.length;
			const files = await this.filesRepo.findFilesForCleanup(deletedSince, batchSize, offset);

			const promises = files.map((file) => this.deleteFile(file));
			const results = await Promise.all(promises);

			results.forEach((result) => !result.success && failingFileIds.push(result.fileId));

			numberOfFilesInBatch = files.length;
			numberOfProcessedFiles += files.length;
			batchCounter += 1;

			this.logger.log(`Finished batch ${batchCounter} with ${numberOfFilesInBatch} files`);
		} while (numberOfFilesInBatch > 0);

		this.logger.log(
			`${
				numberOfProcessedFiles - failingFileIds.length
			} out of ${numberOfProcessedFiles} files were successfully deleted`
		);

		if (failingFileIds.length > 0) {
			this.logger.error(`the following files could not be deleted: ${failingFileIds.toString()}`);
		}
	}

	private async deleteFile(file: File): Promise<{ fileId: string; success: boolean }> {
		try {
			if (!file.isDirectory) {
				await this.fileStorageAdapter.deleteFile(file);
			}
			await this.filesRepo.delete(file);

			return { fileId: file.id, success: true };
		} catch (error) {
			this.logger.error(error);

			return { fileId: file.id, success: false };
		}
	}
}
