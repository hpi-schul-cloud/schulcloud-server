import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger/logger.service';
import { SyncFilesRepo } from '../repo/sync-files.repo';
import { BatchContext, SyncFileItem } from '../types';
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

	async syncFilesForTasks(context: BatchContext): Promise<number> {
		const itemsToSync: SyncFileItem[] = await this.syncFilesRepo.findTaskFilesToSync(Number(context.aggregationSize));
		await this.syncFiles(itemsToSync, context);
		return itemsToSync.length;
	}

	private async syncFiles(itemsToSync: SyncFileItem[], context: BatchContext) {
		for (let i = 0; i < itemsToSync.length; i += context.batchSize) {
			context.batchCounter = i / context.batchSize;
			const batch = itemsToSync.slice(i, i + context.batchSize);
			this.logger.log(`Starting batch with items ${i + 1} to ${i + context.batchSize}`);
			this.logger.debug(`batch size: ${batch.length}`);

			const promises = batch.map((item, counter) => this.syncFile(item, counter, context));
			// eslint-disable-next-line no-await-in-loop
			await Promise.all(promises);
		}
	}

	private async syncFile(item: SyncFileItem, counter: number, context: BatchContext) {
		try {
			const progress = `total: ${
				context.aggregationsCounter * context.aggregationSize + context.batchCounter * context.batchSize + counter + 1
			}, batch: ${counter + 1}/${context.batchSize}`;
			const fileInfo1 = `source file with id = ${item.source.id}, size = ${item.source.size}`;
			this.logger.log(`${progress}, Start syncing ${fileInfo1}`);

			await this.metadataService.syncMetaData(item);
			await this.storageService.syncS3File(item);
			await this.metadataService.persist(item);

			const fileInfo2 = `source file id = ${item.source.id}, target file with id = ${item.target?.id || 'undefined'}`;
			this.logger.log(`${progress}, Successfully synced ${fileInfo2}`);
		} catch (error) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const stack: string = 'stack' in error ? (error as Error).stack : error;

			this.logger.error(`Error syncing source file with id = ${item.source.id}, parentId = ${item.parentId}`);
			this.logger.error(stack);
			await this.metadataService.persistError(item, stack);
		}
	}
}
