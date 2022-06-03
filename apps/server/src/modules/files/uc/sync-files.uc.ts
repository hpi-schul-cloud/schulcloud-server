import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger/logger.service';
import { SyncFilesRepo } from '../repo/sync-files.repo';
import { SyncFileItem } from '../types';
import { SyncFilesMetadataService } from './sync-files-metadata.service';
import { SyncFilesStorageService } from './sync-files-storage.service';

@Injectable()
export class SyncFilesUc {
	constructor(
		private readonly metadataService: SyncFilesMetadataService,
		private syncFilesRepo: SyncFilesRepo,
		private storageService: SyncFilesStorageService,
		private logger: Logger
	) {
		this.logger.setContext(SyncFilesUc.name);
	}

	async syncFilesForTasks(aggregationSize = 5000, batchSize = 50): Promise<number> {
		const itemsToSync: SyncFileItem[] = await this.syncFilesRepo.findTaskFilesToSync(Number(aggregationSize));

		for (let i = 0; i < itemsToSync.length; i += batchSize) {
			const batch = itemsToSync.slice(i, i + batchSize);
			this.logger.log(`Starting batch with items ${i} to ${i + batchSize - 1}`);

			const promises = batch.map((item, counter) => this.syncFile(item, counter, batchSize));
			// eslint-disable-next-line no-await-in-loop
			await Promise.all(promises);
		}

		return itemsToSync.length;
	}

	private async syncFile(item: SyncFileItem, counter: number, batchSize: number) {
		try {
			const progress = `${Number(counter).toString().padStart(Number(batchSize).toString().length)}/${batchSize}`;
			const fileInfo1 = `source file id = ${item.source.id}, size = ${item.source.size}`;
			this.logger.log(`${progress} Starting file sync ${fileInfo1}`);
			await this.metadataService.syncMetaData(item);
			await this.storageService.syncS3File(item);
			await this.metadataService.persist(item);
			const fileInfo2 = `source file id = ${item.source.id}, target file id = ${item.target?.id || 'undefined'}`;
			this.logger.log(`${progress} Successfully synced ${fileInfo2}`);
		} catch (error) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const stack: string = 'stack' in error ? (error as Error).stack : error;

			this.logger.error(`Error syncing source file id = ${item.source.id}, parentId = ${item.parentId}`);
			this.logger.error(stack);
			await this.metadataService.persistError(item, stack);
		}
	}
}
